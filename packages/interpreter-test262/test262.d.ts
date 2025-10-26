declare module 'test262-stream' {
  export default class TestStream {
    constructor(test262Dir: string, options?: TestStreamOptions)
    on(event: 'data', callback: (test: Test262File) => void): void
    on(event: 'end', callback: () => void): void
    on(event: 'error', callback: (error: Error) => void): void
  }
}

interface TestStreamOptions {
  /**
   * Directory from which to load "includes" files (defaults to the
   * appropriate subdirectory of the provided `test262Dir`).
   *
   * Optional. Defaults to `'./harness'`.
   */
  includesDir?: string
  /**
   * File system paths refining the set of tests that should be produced;
   * only tests whose source file matches one of these values (in the case of
   * file paths) or is contained by one of these paths (in the case of
   * directory paths) will be created; all paths are interpreted relative to
   * the root of the provided `test262Dir`.
   *
   * Optional. Defaults to `['test']`.
   */
  paths?: string[]
  /**
   * Flag to disable the insertion of code necessary to execute the test
   * (e.g. assertion functions and "include" files);
   *
   * Optional. Defaults to `false`.
   */
  omitRuntime?: boolean
  /**
   * By default, this stream will emit an error if the provided version of
   * Test262 is not supported; this behavior may be disabled by providing a
   * value of the expected version. Use of this option may cause the stream
   * to emit invalid tests; consider updating the library instead.
   */
  acceptVersion?: string
}

export interface Test262File {
  /**
   * The path to the file from which the test was derived, relative to the provided Test262 directory
   */
  file: string
  /**
   * The complete source text for the test; this contains any "includes"
   * files specified in the frontmatter, "prelude" content if specified,
   * and any "scenario" transformations
   */
  contents: string
  /**
   * An object representation of the metadata declared in the test's "frontmatter" section
   */
  attrs: {
    /**
     * These tests are expected to generate an uncaught exception
     */
    negative?: {
      /**
       * the stage of the test interpretation process that the error is expected to be produced; valid phases are:
       * - parse: occurs while parsing the source text, or while checking it for early errors.
       * - resolution: occurs during module resolution.
       * - runtime: occurs during evaluation.
       */
      phase: 'parse' | 'resolution' | 'runtime'
      /**
       * the name of the constructor of the expected error
       */
      type: string
    }
    /**
     * One or more files whose content must be evaluated in the test realm's global scope prior to test execution,
     * after the files listed in the Test262-Defined Bindings section and the file listed for the async flag below.
     * They must be included in the order given in the source.
     * These files are located within the harness/ directory of the Test262 project.
     */
    includes: string[]
    /**
     * https://github.com/tc39/test262/blob/main/INTERPRETING.md#flags
     */
    flags: Test262Flags[] & {
      [key in Test262Flags]?: true
    }
    /**
     * The locale attribute allows tests to declare explicit information regarding locale specificity.
     * Its value is an array of one or more valid language tags or subtags
     */
    locale?: string[]
    /**
     * The description of the test
     */
    description?: string
    /**
     * The info of the test
     */
    info?: string
    esid?: string
    es5id?: string
    es6id?: string
    [key: string]: unknown
  }
  /**
   * The licensing information included within the test (if any)
   */
  copyright: string
  /**
   * Name describing how the source file was interpreted to create the test
   */
  scenario: string
  /**
   * Numeric offset within the `contents` string at which one or more
   * statements may be inserted without necessarily invalidating the test
   */
  insertionIndex: number
}

type Test262Flags =
  | 'onlyStrict'
  | 'noStrict'
  | 'module'
  | 'raw'
  | 'async'
  | 'generated'
  | 'CanBlockIsFalse'
  | 'CanBlockIsTrue'
  | 'non-deterministic'
