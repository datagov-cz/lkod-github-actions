const fileSystem = require("fs");
const jsonlint = require("jsonlint");

function checkJsonSyntax(filePath) {
  const content = fileSystem.readFileSync(filePath, "utf8");
  const parser = jsonlint.parser;

  const result = [];

  parser.parseError = function parseError(message, options) {
    result.push({
      "start_line": options.loc.first_line,
      "end_line": options.loc.last_line,
      "start_column": options.loc.first_column,
      "end_column": options.loc.last_column,
      "annotation_level": "failure",
      "message": message,
      "title": "validate-json-syntax"
    });
    throw new Error();
  };

  try {
    parser.parse(content);
  } catch (error) {
    // Ignore exception as we collect errors in the error function.
  }
  return result;
}

module.exports = {
  "check": checkJsonSyntax
};
