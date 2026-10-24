export function maskContact(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 5) return "***";
  return value.replace(/\d(?=(?:\D*\d){0,3}\D*$)/g, "*");
}
