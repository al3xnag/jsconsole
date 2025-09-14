// Based on https://github.com/ChromeDevTools/devtools-frontend/blob/30c312b312fa1d0c7b19a42f2f2024e2a4bbd447/front_end/ui/legacy/components/object_ui/JavaScriptREPL.ts#L15C10-L15C27
//
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import { parse } from 'acorn'

export function wrapObjectLiteral(code: string): string {
  // Only parenthesize what appears to be an object literal.
  const result = /^\s*\{\s*(.*)\s*\}[\s;]*$/.exec(code)
  if (result === null) {
    return code
  }

  const [, body] = result
  let level = 0
  for (const c of body) {
    if (c === '{') {
      level++
    } else if (c === '}' && --level < 0) {
      return code
    }
  }

  const test = (expression: string): void =>
    void parse(expression, {
      ecmaVersion: 2022,
      allowAwaitOutsideFunction: true,
      ranges: false,
      allowReturnOutsideFunction: true,
    })

  try {
    // Check if the body can be interpreted as an expression.
    test('return {' + body + '};')

    // No syntax error! Does it work parenthesized?
    const wrappedCode = '({' + body + '})'
    test(wrappedCode)

    return wrappedCode
  } catch {
    return code
  }
}
