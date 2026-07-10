const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid ambiguity

export function generatePNR() {
  let pnr = "";
  for (let i = 0; i < 10; i++) {
    pnr += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return pnr;
}
