const path = require('node:path')
const fs = require('node:fs')

const acornPath = path.resolve(__dirname, '../../node_modules/acorn/dist/acorn.js')
const interpreterPath = path.resolve(__dirname, '../interpreter/dist/index.iife.js')
const interpreterSource = fs.readFileSync(interpreterPath, 'utf8')

/** @type {(test: import("./test262").Test262File) => import("./test262").Test262File} */
module.exports = function preprocessor(test) {
  test.contents = `
    function INJECT_INTERPRETER() {
      globalThis.performance ??= {
        timeOrigin: Date.now(),
        now: function now() { return Date.now() - this.timeOrigin; }
      };

      const acorn = require("${acornPath}")
      const tsBlankSpace = function tsBlankSpace(input) { return input; }
      ${interpreterSource}
      $262.INTERPRETER = interpreter;
    }

    INJECT_INTERPRETER();

    $262.source += '\\n' + INJECT_INTERPRETER.toString() + '\\nINJECT_INTERPRETER();';

    const origEvalScript = $262.evalScript;
    $262.evalScript = function evalScript(code) {
      code = \`$262.INTERPRETER.evaluate(\${JSON.stringify(code)}).value;\`;
      return origEvalScript.call(this, code);
    }

    const origCreateRealm = $262.createRealm;
    $262.createRealm = function createRealm() {
      const realm262 = origCreateRealm.apply(this, arguments);

      const origEvalScript = realm262.evalScript;
      realm262.evalScript = function evalScript(code) {
        code = \`$262.INTERPRETER.evaluate(\${JSON.stringify(code)}).value;\`;
        return origEvalScript.call(this, code);
      }

      return realm262;
    }

    $262.INTERPRETER.evaluate(${JSON.stringify(test.contents)});
  `

  return test
}
