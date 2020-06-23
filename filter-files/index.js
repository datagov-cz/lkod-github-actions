const path = require("path");
const fileSystem = require("fs");
const core = require("@actions/core");

(function () {
  const inputFile = process.env.HOME + "/" + core.getInput("input-file");
  const repository = process.env.GITHUB_WORKSPACE;
  const filterString = core.getInput("filter-json");
  run(repository, inputFile, filterString).catch((err) => {
    core.setFailed(`Action failed with error ${err}`);
  });
})();

async function run(repository, inputFile, filterString) {
  const filterMap = loadFilters(filterString);
  const files = readJsonFile(inputFile);
  const result = {};
  for (let key of Object.keys(filterMap)) {
    result[key] = [];
  }
  for (let file of files) {
    const fullPath = path.join(repository, file);
    if (!fileExists(fullPath)) {
      continue;
    }
    for (let [key, filters] of Object.entries(filterMap)) {
      for (let filter of filters) {
        if (!filter.test(file)) {
          continue;
        }
        result[key].push(file);
        break;
      }
    }
  }
  // Save
  for (let [key, values] of Object.entries(result)) {
    writeJsonFile(process.env.HOME + "/" + key, values)
  }
}

function loadFilters(filterString) {
  const result = JSON.parse(filterString);
  for (let key of Object.keys(result)) {
    const regexps = [];
    for (let filter of result[key]) {
      regexps.push(new RegExp(filter));
    }
    result[key] = regexps;
  }
  return result;
}

function readJsonFile(path) {
  const content = fileSystem.readFileSync(path, {encoding: "utf8", flag: "r"});
  return JSON.parse(content);
}

function fileExists(file) {
  try {
    return fileSystem.existsSync(file)
  } catch (error) {
    return false;
  }
}

function writeJsonFile(path, content) {
  const contentAsStr = JSON.stringify(content);
  fileSystem.writeFileSync(path, contentAsStr);
}
