// Capture the OAuth hash before anything else can consume it.
// Keep temporary credentials in memory only; never log or persist this URL.
export const initialAuthUrl =
  typeof window === "undefined" ? "" : window.location.href;
export function authReturnHref(current: string) {
  if (!initialAuthUrl) return current;
  const captured = new URL(initialAuthUrl),
    latest = new URL(current);
  return captured.origin === latest.origin &&
    captured.pathname === latest.pathname
    ? initialAuthUrl
    : current;
}
export async function finishWithin<T>(
  work: Promise<T>,
  milliseconds = 20000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Bağlantı gecikir. Səhifəni yenidən yoxla və ya yeni bərpa linki istə.",
              ),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
