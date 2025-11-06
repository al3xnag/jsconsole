const path = require('node:path')

const interpreterPath = path.resolve(__dirname, '../interpreter/dist/index.js')

/** @type {(test: import("./test262").Test262File) => import("./test262").Test262File} */
module.exports = function preprocessor(test) {
  test.contents = `
    const { registerHooks } = require('node:module');
    registerHooks({
      load(url, context, nextLoad) {
        if (url.endsWith('ts-blank-space/out/index.js')) {
          return {
            format: 'module',
            source: 'export default function tsBlankSpace(input) { return input; }',
            shortCircuit: true,
          }
        }

        return nextLoad(url, context)
      },
    })

    function LOAD_INTERPRETER() {
      // NOTE: will be instantiated outside of vm, because require is passed from top context
      $262.INTERPRETER = require('${interpreterPath}');
    }

    LOAD_INTERPRETER();

    $262.source += '\\n' + LOAD_INTERPRETER.toString() + '\\nLOAD_INTERPRETER();';

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

    $262.INTERPRETER.evaluate(${JSON.stringify(test.contents)}, {
      globalObject: $262.global,
      metadata: new $262.INTERPRETER.Metadata($262.global),
    });
  `

  return test
}
