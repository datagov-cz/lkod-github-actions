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
  await submitReport(annotations, token);
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

async function submitReport(annotations, token) {
  const octokit = github.getOctokit(token);
  const context = github.context;
  const ref = getSha(context);
  if (!ref) {
    core.error(`Context: ${JSON.stringify(context, null, 2)}`);
    return process.exit(1);
  }
  const check_run = github.context.workflow;
  const {data: {check_runs}} = await octokit.checks.listForRef({
    ...context.repo,
    ref,
    check_run,
    status: "in_progress"
  });
  const check_run_id = check_runs[0].id;
  for (const reports of createBatches(50, annotations)) {
    await octokit.checks.update({
      ...context.repo,
      check_run_id,
      output: {
        title: `${check_run} Check Run`,
        summary: `${reports.length} errors(s) found`,
        annotations: reports
      }
    });
  }
}

const getSha = (context) => {
  if (context.eventName === "pull_request") {
    return context.payload.pull_request.head.sha || context.payload.after;
  } else {
    return context.sha;
  }
};

const createBatches = (size, inputs) => inputs.reduce((batches, input) => {
  const current = batches[batches.length - 1];
  current.push(input);
  if (current.length === size) {
    batches.push([]);
  }
  return batches;
}, [[]]);

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
