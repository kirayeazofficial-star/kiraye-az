// Phone numbers and links are not allowed in the title or description: contacts go in their own
// fields (and sites outside kirayeal.az must not be advertised). Used by the form and the server.
const linkPattern = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}\.(az|com|ru|net|org|info|me|io|tr|ua|biz|site|online|store|shop)\b/i;
const phoneRun = /\+?\d[\d\s().-]{7,}\d/g;

export function contactInText(text: string): "phone" | "link" | null {
  if (linkPattern.test(text.replace(/kirayeal\.az/gi, ""))) return "link"; // mentioning our own site is fine
  for (const run of text.match(phoneRun) ?? []) if (run.replace(/\D/g, "").length >= 9) return "phone";
  return null;
}

export const contactInTextMessage = (kind: "phone" | "link") => kind === "phone"
  ? "Təsvirdə və başlıqda telefon nömrəsi yazmaq olmaz. Nömrə “Əlaqə” addımında göstərilir."
  : "Təsvirdə və başlıqda sayt linki yazmaq olmaz.";
