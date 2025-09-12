/**
 * Derive a dense array (no `undefined`s) from a single value or array.
 */
function toDenseArray<T>(x: T | ConcatArray<T>): NonNullable<T>[] {
  const array: T[] = [];
  return array.concat(x).filter(y => y !== null && y !== undefined);
}

export default toDenseArray;
