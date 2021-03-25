module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 992:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {

// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");;
// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");;
// CONCATENATED MODULE: ./index.ts


const FILES_TO_IGNORE = [".git"];
(function () {
    const catalogTemplatePath = getInput("catalog-template-file");
    console.info("Loading template from", catalogTemplatePath);
    const catalog = readJsonFile(catalogTemplatePath);
    const datasetDirectory = getInput("datasets-root");
    console.info("Searching for files in", datasetDirectory);
    const files = listFilesRelativeToDirectory(datasetDirectory, (ref) => FILES_TO_IGNORE.includes(ref.fileName));
    console.info("Number of detected files", files.length);
    const datasets = collectDatasetIris(files);
    console.info("Number of detected datasets", datasets.length);
    catalog["datová_sada"] = [
        ...(catalog["datová_sada"] || []),
        ...datasets
    ];
    const catalogOutputPath = getInput("filter-output-file");
    console.info("Saving catalog file to", catalogOutputPath);
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
function listFilesRelativeToDirectory(directory, filterFunction = () => false, relativeDirectory = "./") {
    console.info("Searching", directory);
    let result = [];
    for (const fileName of external_fs_namespaceObject.readdirSync(directory)) {
        const reference = {
            "fileName": fileName,
            "fullPath": external_path_namespaceObject.join(directory, fileName),
            "relativePath": external_path_namespaceObject.join(relativeDirectory, fileName),
        };
        console.info("New file", fileName);
        if (!filterFunction(reference)) {
            continue;
        }
        if (external_fs_namespaceObject.statSync(reference.fullPath).isDirectory()) {
            result = result.concat(listFilesRelativeToDirectory(reference.fullPath, filterFunction, reference.relativePath));
        }
        else {
            result.push(reference);
        }
    }
    return result;
}
function readJsonFile(path) {
    const content = external_fs_namespaceObject.readFileSync(path, "utf8");
    return JSON.parse(content);
}
function collectDatasetIris(references) {
    const result = new Set();
    for (const reference of references) {
        if (!reference.fileName.toLowerCase().endsWith(".jsonld")) {
            continue;
        }
        const content = readJsonFile(reference.fullPath);
        if (content["typ"] !== "Datová sada") {
            console.info("This is not a dataset.", reference.relativePath);
            continue;
        }
        console.info("Adding dataset", content["iri"], "from", reference.relativePath);
        result.add(content["iri"]);
    }
    return [...result];
}
function writeJsonFile(path, content) {
    const contentAsStr = JSON.stringify(content);
    external_fs_namespaceObject.writeFileSync(path, contentAsStr);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(992);
/******/ })()
;