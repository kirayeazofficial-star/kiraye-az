// Runs before the site becomes interactive.

// 1. iOS 15 Safari (iPhone 7/8) has no AbortSignal.timeout: the cabinet listings request used to fail there.
type AnySignal = typeof AbortSignal & { timeout?: (ms: number) => AbortSignal };
const signalApi = (typeof AbortSignal !== "undefined" ? AbortSignal : undefined) as AnySignal | undefined;
if (signalApi && typeof signalApi.timeout !== "function") {
  signalApi.timeout = (ms: number) => { const controller = new AbortController(); setTimeout(() => controller.abort(), ms); return controller.signal; };
}
