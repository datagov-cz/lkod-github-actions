const fileSystem = require("fs");
const jsonld = require("jsonld");

async function checkJsonLdNotEmpty(filePath, ignoreInvalidSyntax) {
  const contentAsStr = fileSystem.readFileSync(filePath, "utf8");
  let content;
  try {
    content = JSON.parse(contentAsStr);
  } catch (error) {
    if (ignoreInvalidSyntax) {
      return [];
    }
    // Ignore exception as we collect errors in the error function.
    return [{
      "annotation_level": "failure",
      "message": error.message,
      "title": "validate-jsonld-not-empty",
      "end_line": 0,
      "start_line": 0
    }];
  }

  const data = await jsonld.flatten(content);
  if (data.length > 0) {
    return [];
  }
  return [{
    "annotation_level": "failure",
    "message": "File is empty.",
    "title": "validate-jsonld-not-empty",
    "end_line": 0,
    "start_line": 0
  }];
}

module.exports = {
  "check": checkJsonLdNotEmpty
};
