// Azerbaijan mobile numbers only; do not silently accept landlines for SMS.
export function normalizeMobile(value: string): string | null {
  let digits = value.replace(/[\s()+-]/g, "");
  if (digits.startsWith("00994")) digits = digits.slice(2);
  if (digits.startsWith("994")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^(10|50|51|55|60|70|77|99)\d{7}$/.test(digits)
    ? `+994${digits}`
    : null;
}
