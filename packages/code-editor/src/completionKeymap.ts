// Based on https://github.com/ChromeDevTools/devtools-frontend/blob/ea58b6707370f3b440b362fe178e7f6cd4a9170b/front_end/ui/components/text_editor/config.ts#L166
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

import { EditorView, KeyBinding } from '@codemirror/view'
import {
  acceptCompletion,
  closeCompletion,
  completionStatus,
  moveCompletionSelection,
  startCompletion,
} from '@codemirror/autocomplete'
import {
  acceptCompletionIfNotConservative,
  moveCompletionSelectionIfNotConservative,
} from './conservativeCompletion'

export function completionKeymap(): KeyBinding[] {
  return [
    { key: 'Ctrl-Space', run: startCompletion },
    { key: 'Escape', run: closeCompletion },
    { key: 'ArrowDown', run: moveCompletionSelectionIfNotConservative(true) },
    { key: 'ArrowUp', run: moveCompletionSelectionBackward },
    { mac: 'Ctrl-n', run: moveCompletionSelectionIfNotConservative(true) },
    { mac: 'Ctrl-p', run: moveCompletionSelectionBackward },
    { key: 'PageDown', run: moveCompletionSelection(true, 'page') },
    { key: 'PageUp', run: moveCompletionSelection(false, 'page') },
    { key: 'Tab', run: acceptCompletion },
    { key: 'Enter', run: acceptCompletionIfNotConservative },
    { key: 'ArrowRight', run: acceptCompletionIfAtEndOfLine },
    { key: 'End', run: acceptCompletionIfAtEndOfLine },
  ]
}

function moveCompletionSelectionBackward(view: EditorView): boolean {
  if (completionStatus(view.state) !== 'active') {
    return false
  }

  moveCompletionSelection(false)(view)
  return true
}

function acceptCompletionIfAtEndOfLine(view: EditorView): boolean {
  const cursorPosition = view.state.selection.main.head
  const line = view.state.doc.lineAt(cursorPosition)
  const column = cursorPosition - line.from
  const isCursorAtEndOfLine = column >= line.length
  if (isCursorAtEndOfLine) {
    return acceptCompletion(view)
  }

  // We didn't handle this key press
  // so it will be handled by default behavior.
  return false
}
