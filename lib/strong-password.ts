// Generate only on the device; never persist passwords in application storage.
export function createStrongPassword(): string {
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  function randomIndex(length: number) {
    const bytes = new Uint8Array(1);
    const limit = 256 - (256 % length);
    do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
    return bytes[0] % length;
  }
  const pick = (chars: string) => chars[randomIndex(chars.length)];
  const chars = groups.join("");
  const result = groups.map(pick);
  while (result.length < 20) result.push(pick(chars));
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}
