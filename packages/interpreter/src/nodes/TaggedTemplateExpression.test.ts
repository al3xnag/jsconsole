import { expect } from 'vitest'
import { it } from '../test-utils'

it(`
    const a = 1;
    const b = "2";

    function tag(strings, a, b) {
      return [strings, a, b]
    }

    tag\`a is \${a} and b is \${b}.\`;
  `, ({ value }) => {
  expect(value).toEqual([['a is ', ' and b is ', '.'], 1, '2'])
  expect(value[0].raw).toEqual(['a is ', ' and b is ', '.'])
})

// Example from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
it(
  `
    const person = "Mike";
    const age = 28;

    function myTag(strings, personExp, ageExp) {
      const str0 = strings[0]; // "That "
      const str1 = strings[1]; // " is a "
      const str2 = strings[2]; // "."

      const ageStr = ageExp < 100 ? "youngster" : "centenarian";

      return \`\${str0}\${personExp}\${str1}\${ageStr}\${str2}\`;
    }

    const output = myTag\`That \${person} is a \${age}.\`;
    output;
  `,
  'That Mike is a youngster.',
)

it(
  `
    function tag(strings) {
      return strings.raw[0];
    }

    tag\`string text line 1 \\n string text line 2\`;
  `,
  'string text line 1 \\n string text line 2',
)

it(
  `
    function tag(strings) {
      return strings[0];
    }

    tag\`string text line 1 \\n string text line 2\`;
  `,
  'string text line 1 \n string text line 2',
)

it(
  `
    function tag(strings) {
      return [strings[0], strings.raw[0]];
    }

    tag\`\\9_invalid_escape_sequence\`;
  `,
  [undefined, '\\9_invalid_escape_sequence'],
)

it('String.raw`1\\t2`', '1\\t2')
