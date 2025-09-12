export default function stringSetsAreEqual(a: Array<string | number>, b: Array<string | number>) {
  if (a.length !== b.length) return false;
  return JSON.stringify(a.map((id) => `${id}`).sort()) === JSON.stringify(b.map((id) => `${id}`).sort());
}
