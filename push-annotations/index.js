// Relevant repositories:
// https://docs.github.com/en/rest/reference/checks
// https://github.com/yuzutech/annotations-action

const fileSystem = require("fs");
const readline = require("readline");
const core = require("@actions/core");
const github = require("@actions/github");

const LEVEL_NOTICE = "notice";
const LEVEL_WARNING = "warning";
const LEVEL_FAILURE = "failure";

(async function () {
  try {
    await main();
  } catch (error) {
    core.setFailed(error.message);
  }
})();

async function main() {
  const [inputFile, token, title] = readInputs();
  const annotations = await loadAnnotationFile(inputFile);
  const levels = collectLevels(annotations);
  // The API limits upload to 50 annotations at a time.
  const batches = createBatches(annotations, 50)
  const octokit = github.getOctokit(token);
  const checkRunId = await createCheck(octokit, title);
  const conclusion = createConclusion(levels);
  const summary = createSummary(levels);
  for (const batch of batches) {
    await updateCheck(octokit, checkRunId, conclusion, summary, batch);
  }
}

function readInputs() {
  const annotationFile = core.getInput("annotations-file", { required: true });
  const inputFile = process.env.HOME + "/" + annotationFile;
  const token = process.env.GITHUB_TOKEN;
  const title = core.getInput("title");
  return [inputFile, token, title];
}

async function loadAnnotationFile(path) {
  const readInterface = readline.createInterface({
    "input": fileSystem.createReadStream(path),
    // Reader will wait for given time after CR is detected before, 
    // considering next LF as a next line.
    "crlfDelay": Infinity,
  });
  const result = [];
  for await (const line of readInterface) {
    result.push(JSON.parse(line));
  }
  return result;
}

function createBatches(inputs, size) {
  return inputs.reduce((batches, input) => {
    const current = batches[batches.length - 1];
    current.push(input);
    if (current.length === size) {
      batches.push([]);
    }
    return batches;
  }, [[]])
}

function collectLevels(annotations) {
  const result = {
    [LEVEL_NOTICE]: 0,
    [LEVEL_WARNING]: 0,
    [LEVEL_FAILURE]: 0,
  };
  for (const report of annotations) {
    result[report.annotation_level] += 1;
  }
  return result;
}

/**
 * Create a check that we can use to add annotation into.
 */
async function createCheck(octokit, userTitle) {
  const { owner, repo } = github.context.repo;
  const name = isEmpty(userTitle) ? github.context.workflow : userTitle;
  const headSha = getHeadRef(github.context);
  try {
    const { data: { id: checkRunId } } = await octokit.checks.create({
      "owner": owner,
      "repo": repo,
      "name": name,
      "head_sha": headSha,
      "status": "in_progress",
    });
    return checkRunId;
  } catch (err) {
    throw new Error(
      `Can't create a check to '${owner}/${repo}:${headSha}' - cause: ${err}`);
  }
};

function isEmpty(value) {
  return value === null || value === undefined || value === "";
}

function getHeadRef(context) {
  if (context.payload.pull_request) {
    return context.payload.pull_request.head.sha;
  } else {
    return context.sha;
  }
};

function createConclusion(levels) {
  if (levels[LEVEL_FAILURE] > 0) {
    return "failure";
  } else if (levels[LEVEL_WARNING] > 0 || levels[LEVEL_NOTICE > 0]) {
    return "neutral";
  } else {
    return "success";
  }
}

function createSummary(levels) {
  return `${levels[LEVEL_FAILURE]} failure(s) found\n`
    + `${levels[LEVEL_WARNING]} warning(s) found\n`
    + `${levels[LEVEL_NOTICE]} notice(s) found\n`;
}

async function updateCheck(
  octokit, checkRunId, conclusion, summary, annotations,
) {
  try {
    await octokit.checks.update({
      "owner": github.context.repo.owner,
      "repo": github.context.repo.repo,
      "check_run_id": checkRunId,
      "status": "completed",
      "conclusion": conclusion,
      "output": {
        // This is visible in label in check list.
        "title": `Check Run ${checkRunId}`,
        "summary": summary,
        "annotations": annotations,
      },
    });
  }
  catch (err) {
    throw new GitHubApiError(
      `Can't update check {check_run_id: ${checkRunId}} - cause: ${err}`);
  }
}
