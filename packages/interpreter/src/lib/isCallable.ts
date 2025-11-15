// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
const documentAll = typeof document == 'object' && document.all

// https://tc39.es/ecma262/#sec-iscallable
export const isCallable =
  typeof documentAll == 'undefined' && documentAll !== undefined
    ? function (argument: unknown): argument is Function {
        return typeof argument == 'function' || argument === documentAll
      }
    : function (argument: unknown): argument is Function {
        return typeof argument == 'function'
      }
