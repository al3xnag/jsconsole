/**
 * Check if a flag is set in a bitwise flags value.
 *
 * @example
 * const Read = 1 << 0; // 1
 * const Write = 1 << 1; // 2
 * const Execute = 1 << 2; // 4
 * const Delete = 1 << 3; // 8
 *
 * hasFlag(Read | Write, Read); // true
 * hasFlag(Read | Write, Write); // true
 * hasFlag(Read | Write, Read | Write); // true
 * hasFlag(Read | Write | Execute, Read | Write); // true
 * hasFlag(Read | Write, Execute); // false
 * hasFlag(Read | Write, Delete); // false
 * hasFlag(Read | Write | Execute, Delete); // false
 */
export function hasFlag(actualFlags: number, requiredFlags: number): boolean {
  return (actualFlags & requiredFlags) === requiredFlags
}
