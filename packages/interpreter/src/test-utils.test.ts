import { it, TestWindow } from './test-utils'

it('window != null', true, { globalObject: new TestWindow() })
it('window === globalThis', true, { globalObject: new TestWindow() })
it("document.querySelector('#does-not-exist')", null, { globalObject: new TestWindow() })
