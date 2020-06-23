const path = require("path");
const fileSystem = require("fs");
const core = require("@actions/core");
const action = require("./check-json-syntax");

(function () {
  const inputFile = process.env.HOME + "/" + core.getInput("input-file");
  const outputFile = process.env.HOME + "/" + core.getInput("output-file");
  const repository = process.env.GITHUB_WORKSPACE;
  try {
    run(repository, inputFile, outputFile);
  } catch(err) {
    core.setFailed(`Action failed with error ${err}`);
    console.log(err);
  }
})();

function run(repository, inputFile, outputFile) {
  const files = readJsonFile(inputFile);
  const reports = [];
  for (const file of files) {
    const fullPath = path.join(repository, file);
    for (const report of action.check(fullPath)) {
      report.path = file;
      core.error(` [validate-json-syntax] ${file}\n${report.message}`);
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
