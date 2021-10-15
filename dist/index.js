/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 828:
/***/ ((__unused_webpack_module, exports) => {

function parseInputTags (inputText) {
  const removeNewLine = inputText.split('\n').join(',')
  const splitByComma = removeNewLine.split(',');

  const trimmed =  splitByComma.map(tag => tag.trim())

  const notEmpty = trimmed.filter(tag => tag !== "")

  return notEmpty
}

exports.parseInputTags = parseInputTags

/***/ }),

/***/ 885:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 378:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 669:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
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
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(885)
const github = __nccwpck_require__(378)
const util = __nccwpck_require__(669)

const { parseInputTags } = __nccwpck_require__(828)

async function run() {
  try {
    // check if this is running on a pull request
    core.info('debug payload')
    core.info(util.inspect(github.context.payload, false, null, true))

    core.info('debug event')
    core.info(util.inspect(github.context.event, false, null, true))

    if (!github.context.payload.pull_request) {
      return core.setOutput('passed', true)
    }

    const token = core.getInput('githubToken');
    const context = github.context
    const octokit = github.getOctokit(token)

    const hasSomeInput = core.getInput('hasSome')
    const hasAllInput = core.getInput('hasAll')
    const hasNoneInput = core.getInput('hasNone')
    const hasNotAllInput = core.getInput('hasNotAll')

    const hasSomeLabels = parseInputTags(hasSomeInput)
    const hasAllLabels = parseInputTags(hasAllInput)
    const hasNoneLabels = parseInputTags(hasNoneInput)
    const hasNotAllLabels = parseInputTags(hasNotAllInput)

    const failMessages = []

    const { data: labelsOnIssue } = await octokit.issues.listLabelsOnIssue({
      ...context.repo,
      issue_number: context.payload.pull_request.number
    })

    const prLabels = labelsOnIssue.map(item => item.name)

    const hasSomeResult = !hasSomeInput || hasSomeLabels.some((label) =>
      prLabels.includes(label)
    )

    const hasAllResult = !hasAllInput || hasAllLabels.every((label) =>
      prLabels.includes(label)
    )

    const hasNoneResult = !hasNoneInput || hasNoneLabels.every((label) =>
      !prLabels.includes(label)
    )

    const hasNotAllResult = !hasNotAllInput || hasNotAllLabels.some((label) =>
      !prLabels.includes(label)
    )

    if (!hasSomeResult) {
      failMessages.push(`The PR needs to have at least one of the following labels to pass this check: ${hasSomeLabels.join(
        ', '
      )}`)
    }

    if (!hasAllResult) {
      failMessages.push(`The PR needs to have all of the following labels to pass this check: ${hasAllLabels.join(
        ', '
      )}`)
    }

    if (!hasNoneResult) {
      failMessages.push(`The PR needs to have none of the following labels to pass this check: ${hasNoneLabels.join(
        ', '
      )}`)
    }

    if (!hasNotAllResult) {
      failMessages.push(`The PR needs to not have at least one of the following labels to pass this check: ${hasNotAllLabels.join(
        ', '
      )}`)
    }

    const checks = await octokit.checks.listForRef({
      ...context.repo,
      ref: context.payload.pull_request.head.ref,
    });

    const checkRunIds = checks.data.check_runs.filter(check => check.name === context.job).map(check => check.id)

    if (failMessages.length) {
      // update old checks
      for (const id of checkRunIds) {
        await octokit.checks.update({
          ...context.repo,
          check_run_id: id,
          conclusion: 'failure',
          output: {
            title: 'Labels did not pass provided rules',
            summary: failMessages.join('. ')
          }
        })
      }

      core.setFailed(failMessages.join('. '))
    } else {
      // update old checks
      for (const id of checkRunIds) {
        await octokit.checks.update({
          ...context.repo,
          check_run_id: id,
          conclusion: 'success',
          output: {
            title: 'Labels follow all the provided rules',
            summary: ''
          }
        })
      }

      core.setOutput('passed', true)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

})();

module.exports = __webpack_exports__;
/******/ })()
;