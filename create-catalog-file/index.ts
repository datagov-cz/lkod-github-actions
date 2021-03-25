import * as path from "path";
import * as fileSystem from "fs";

interface FileReference {

  fileName: string;

  fullPath: string;

  relativePath: string;

}

type ShouldIgnore = (file: FileReference) => boolean;

const FILES_TO_IGNORE = [".git"];

(function () {
  const catalogTemplatePath = getInput("catalog-template-file");
  const catalog = readJsonFile(catalogTemplatePath);

  const datasetDirectory = getInput("datasets-root");
  const files = listFilesRelativeToDirectory(
    datasetDirectory,
    (ref) => FILES_TO_IGNORE.includes(ref.fileName));
  const datasets = collectDatasetIris(files);
  catalog["datová_sada"] = [
    ...(catalog["datová_sada"] || []),
    ...datasets
  ];

  const catalogOutputPath = getInput("filter-output-file");
  writeJsonFile(catalogOutputPath, catalog);
})();

// From "@actions/core".
function getInput(name) {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const value = process.env[key] || '';
  if (!value) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value.trim();
}

function listFilesRelativeToDirectory(
  directory: string,
  filterFunction: ShouldIgnore = () => false,
  relativeDirectory = "./"
) {
  let result = [];
  for (const fileName of fileSystem.readdirSync(directory)) {
    const reference: FileReference = {
      "fileName": fileName,
      "fullPath": path.join(directory, fileName),
      "relativePath": path.join(relativeDirectory, fileName),
    };
    if (!filterFunction(reference)) {
      continue;
    }
    if (fileSystem.statSync(reference.fullPath).isDirectory()) {
      result = result.concat(
        listFilesRelativeToDirectory(
          reference.fullPath, filterFunction, reference.relativePath));
    } else {
      result.push(reference);
    }
  }
  return result;
}

function readJsonFile(path) {
  const content = fileSystem.readFileSync(path, "utf8");
  return JSON.parse(content);
}

function collectDatasetIris(references: FileReference[]): string[] {
  const result: Set<string> = new Set();
  for (const reference of references) {
    if (!reference.fileName.toLowerCase().endsWith(".jsonld")) {
      continue;
    }
    const content = readJsonFile(reference.fullPath);
    if (content["typ"] !== "Datová sada") {
      console.log("This is not a dataset.", reference.relativePath);
      continue;
    }
    console.log(
      "Adding dataset", content["iri"], "from", reference.relativePath);
    result.add(content["iri"]);
  }
  return [...result];
}

function writeJsonFile(path, content) {
  const contentAsStr = JSON.stringify(content);
  fileSystem.writeFileSync(path, contentAsStr);
}
