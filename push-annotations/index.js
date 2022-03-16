// Relevant repositories:
// https://github.com/yuzutech/annotations-action

const fileSystem = require("fs");
const readline = require("readline");
const core = require("@actions/core");
const github = require("@actions/github");

(function () {
  const inputFile = process.env.HOME + "/" + core.getInput("annotations-file");
  const token = process.env.GITHUB_TOKEN;
  run(inputFile, token).catch((err) => {
    core.setFailed(`Action failed with error ${err}`);
    console.log(err);
  });
})();

async function run(inputFile, token) {
  const annotations = await loadAnnotationFile(inputFile);
  const batches = createBatches(50, annotations)
  await submitReport(batches, token);
  checkForFailures(annotations);
}

async function loadAnnotationFile(path) {
  const readInterface = readline.createInterface({
    input: fileSystem.createReadStream(path),
    crlfDelay: Infinity // \r\n as a single line break
  });
  const result = [];
  for await (const line of readInterface) {
    result.push(JSON.parse(line));
  }
  return result;
}

const createBatches = (size, inputs) => inputs.reduce((batches, input) => {
  const current = batches[batches.length - 1];
  current.push(input);
  if (current.length === size) {
    batches.push([]);
  }
  return batches;
}, [[]]);

async function submitReport(batches, token) {
  const octokit = github.getOctokit(token);
  const checkRunId = await createCheck(octokit, github);
  for (const batch of batches) {
    await octokit.checks.update({
      "owner": github.context.repo.owner,
      "repo": github.context.repo.repo,
      "check_run_id": checkRunId,
      "status": "completed",
      "output": {
        "title": `Check Run: ${checkRunId}`,
        "summary": `${batch.length} errors(s) found`,
        "annotations": batch,
      },
    });
  }
}

/**
 * Create a check that we can use to add annotation into.
 */
const createCheck = async (octokit, github) => {
  const headRef = getHeadRef(github.context);
  const {data: {id: checkRunId}} = await octokit.checks.create({
    "owner": github.context.repo.owner,
    "repo": github.context.repo.repo,
    "name": github.context.workflow,
    "head_sha": headRef,
    "status": "in_progress",
  });
  return checkRunId;
};

const getHeadRef = (context) => {
  if (context.payload.pull_request) {
    return context.payload.pull_request.head.sha;
  } else {
    return context.sha;
  }
};

function checkForFailures(annotations) {
  let failureDetected = false;
  for (const report of annotations) {
    if (report.annotation_level === "failure") {
      failureDetected = true;
      break;
    }
  }
  if (failureDetected) {
    core.setFailed(
      "Some report are of type 'failure' see above logs for more details.");
  }
}
