// One shared Intl.DateTimeFormat per locale + options. Creating a formatter is slow (on iOS 15 Safari it takes
// tens of milliseconds each), and lists format a date per row on every render: the leader panel's Elanlar list
// froze old iPhones for 2–3 seconds on each tap. Reusing the formatter makes each date practically free.
const cache = new Map<string, Intl.DateTimeFormat>();
export function dateFormat(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) { format = new Intl.DateTimeFormat(locale, options); cache.set(key, format); }
  return format;
}
