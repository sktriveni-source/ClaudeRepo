// Spreadsheet-column-style increment: A, B, ... Z, AA, AB, ...
// Mirrors the alpha revision letters used in engineering change management
// (ENOVIA-style maturity states move a part from rev A to rev B on release).
export function nextRevision(current) {
  if (!current) return "A";
  const chars = current.split("");
  let i = chars.length - 1;
  while (i >= 0) {
    if (chars[i] !== "Z") {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.join("");
    }
    chars[i] = "A";
    i -= 1;
  }
  return "A" + chars.join("");
}
