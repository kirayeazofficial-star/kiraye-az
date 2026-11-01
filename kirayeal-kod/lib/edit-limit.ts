// A listing can be edited at most twice in any 24 hours. These helpers tell the owner exactly when
// the next edit becomes possible (Baku time), instead of a vague "tomorrow".
export function nextEditAt(editLog: string[] | undefined | null, now = Date.now()): Date | null {
  const recent = (editLog ?? []).map(value => Date.parse(value)).filter(time => Number.isFinite(time) && time > now - 86400000).sort((a, b) => a - b);
  return recent.length >= 2 ? new Date(recent[0] + 86400000) : null;
}

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

export function editLimitMessage(next: Date | null) {
  if (!next) return "Elanı 24 saat ərzində 2 dəfə redaktə etmək olar. Bir az sonra yenidən cəhd edin.";
  // Month names written out: browsers often lack Azerbaijani month names and print "M10".
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baku", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(next).map(part => [part.type, part.value]));
  const when = `${parts.day} ${months[Number(parts.month) - 1]}, ${parts.hour}:${parts.minute}`;
  return `Elanı 24 saat ərzində 2 dəfə redaktə etmək olar. Yenidən redaktə etmək mümkün olacaq: ${when}.`;
}
