// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/core/platform/StringUtilities.ts#L49

function toHexadecimal(charCode: number, padToLength: number): string {
  return charCode.toString(16).toUpperCase().padStart(padToLength, '0')
}

const escapedReplacements = new Map([
  ['\b', '\\b'],
  ['\f', '\\f'],
  ['\n', '\\n'],
  ['\r', '\\r'],
  ['\t', '\\t'],
  ['\v', '\\v'],
  ["'", "\\'"],
  ['\\', '\\\\'],
  ['<!--', '\\x3C!--'],
  ['<script', '\\x3Cscript'],
  ['</script', '\\x3C/script'],
])

export function stringifyString(content: string): string {
  const patternsToEscape = /(\\|<(?:!--|\/?script))|(\p{Control})|(\p{Surrogate})/gu
  const patternsToEscapePlusSingleQuote =
    /(\\|'|<(?:!--|\/?script))|(\p{Control})|(\p{Surrogate})/gu
  const escapePattern = (
    match: string,
    pattern: string,
    controlChar: string,
    loneSurrogate: string,
  ): string => {
    if (controlChar) {
      if (escapedReplacements.has(controlChar)) {
        // @ts-expect-error https://github.com/microsoft/TypeScript/issues/13086
        return escapedReplacements.get(controlChar)
      }
      const twoDigitHex = toHexadecimal(controlChar.charCodeAt(0), 2)
      return '\\x' + twoDigitHex
    }
    if (loneSurrogate) {
      const fourDigitHex = toHexadecimal(loneSurrogate.charCodeAt(0), 4)
      return '\\u' + fourDigitHex
    }
    if (pattern) {
      return escapedReplacements.get(pattern) || ''
    }
    return match
  }

  let escapedContent = ''
  let quote = ''
  if (!content.includes("'")) {
    quote = "'"
    escapedContent = content.replaceAll(patternsToEscape, escapePattern)
  } else if (!content.includes('"')) {
    quote = '"'
    escapedContent = content.replaceAll(patternsToEscape, escapePattern)
  } else if (!content.includes('`') && !content.includes('${')) {
    quote = '`'
    escapedContent = content.replaceAll(patternsToEscape, escapePattern)
  } else {
    quote = "'"
    escapedContent = content.replaceAll(patternsToEscapePlusSingleQuote, escapePattern)
  }
  return `${quote}${escapedContent}${quote}`
}
