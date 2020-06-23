const path = require("path");
const fileSystem = require("fs");
const core = require("@actions/core");

(function () {
  const directory =
    core.getInput("directory") == 0
      ? process.env.GITHUB_WORKSPACE
      : core.getInput("directory");
  const outputJsonFile =
    core.getInput("output-json-file") == 0
      ? (process.env.HOME + "/files.json")
      : core.getInput("output-json-file");
  run(directory, outputJsonFile).catch((err) => {
    core.setFailed(`Action failed with error ${err}`);
    console.log(err);
  });
})();

async function run(directory, outputJsonFile) {
  const ignore = [".git"];
  const files = listFilesInDirectory(ignore, directory, "./");
  writeJsonFile(outputJsonFile, files);
}

function listFilesInDirectory(filesToIgnore, directory, relativeDirectory) {
  const files = fileSystem.readdirSync(directory);
  let result = [];
  for (const file of files) {
    if (filesToIgnore.includes(file)) {
      continue;
    }
    const fullPath = path.join(directory, file);
    const relativePath = path.join(relativeDirectory, file);
    if (fileSystem.statSync(fullPath).isDirectory()) {
      result = result.concat(
        listFilesInDirectory(filesToIgnore, fullPath, relativePath));
    } else {
      result.push(relativePath);
    }
  }
  return result;
}

function writeJsonFile(path, content) {
  const contentAsStr = JSON.stringify(content);
  fileSystem.writeFileSync(path, contentAsStr);
}
