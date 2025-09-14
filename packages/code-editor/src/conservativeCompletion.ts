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

import { EditorView } from '@codemirror/view'
import { StateEffect, StateField } from '@codemirror/state'
import {
  acceptCompletion,
  completionStatus,
  moveCompletionSelection,
  selectedCompletionIndex,
} from '@codemirror/autocomplete'

const disableConservativeCompletion = StateEffect.define()

// When enabled, this suppresses the behavior of showCompletionHint
// and accepting of completions with Enter until the user selects a
// completion beyond the initially selected one.
export const conservativeCompletion = StateField.define<boolean>({
  create() {
    return true
  },
  update(value, tr) {
    if (completionStatus(tr.state) !== 'active') {
      return true
    }

    if (
      (selectedCompletionIndex(tr.startState) ?? 0) !== (selectedCompletionIndex(tr.state) ?? 0) ||
      tr.effects.some((e) => e.is(disableConservativeCompletion))
    ) {
      return false
    }

    return value
  },
})

export function acceptCompletionIfNotConservative(view: EditorView): boolean {
  return !view.state.field(conservativeCompletion, false) && acceptCompletion(view)
}

// This is a wrapper around CodeMirror's own moveCompletionSelection command, which
// selects the first selection if the state of the selection is conservative, and
// otherwise behaves as normal.
export function moveCompletionSelectionIfNotConservative(
  forward: boolean,
  by: 'option' | 'page' = 'option',
): (view: EditorView) => boolean {
  return (view) => {
    if (completionStatus(view.state) !== 'active') {
      return false
    }

    if (view.state.field(conservativeCompletion, false)) {
      view.dispatch({ effects: disableConservativeCompletion.of(null) })
      return true
    }

    const moveSelectionResult: boolean = moveCompletionSelection(forward, by)(view)
    return moveSelectionResult
  }
}
