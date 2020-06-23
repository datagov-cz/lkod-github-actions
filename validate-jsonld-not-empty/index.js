const path = require("path");
const fileSystem = require("fs");
const core = require("@actions/core");
const action = require("./validate-jsonld-not-empty");

(async function () {
  const inputFile = process.env.HOME + "/" + core.getInput("input-file");
  const outputFile = process.env.HOME + "/" + core.getInput("output-file");
  const ignoreInvalidSyntax = core.getInput("ignore-invalid-syntax");
  const repository = process.env.GITHUB_WORKSPACE;
  try {
    await run(repository, ignoreInvalidSyntax, inputFile, outputFile);
  } catch (err) {
    core.setFailed(`Action failed with error ${err}`);
    console.log(err);
  }
})();

async function run(repository, ignoreInvalidSyntax, inputFile, outputFile) {
  const files = readJsonFile(inputFile);
  const reports = [];
  for (const file of files) {
    const fullPath = path.join(repository, file);
    const fileReport = await action.check(fullPath, ignoreInvalidSyntax);
    for (const report of fileReport) {
      report.path = file;
      core.error(` [validate-jsonld-not-empty] ${file}\n${report.message}`);
      reports.push(report);
    }
  }
  appendJsonLinesFile(outputFile, reports);
}

function readJsonFile(path) {
  const content = fileSystem.readFileSync(
    path, {"encoding": "utf8", "flag": "r"});
  return JSON.parse(content);
}

function appendJsonLinesFile(path, reports) {
  let content = "";
  for (const report of reports) {
    content += JSON.stringify(report);
    content += "\n";
  }
  fileSystem.appendFileSync(
    path, content, {"encoding": "utf8"});
}
