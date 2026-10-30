"use client";
import { useEffect } from "react";
// Short success messages ("Banner yeniləndi.", "Elan silindi.") disappear by themselves after a few
// seconds instead of staying on the page. Error messages are not passed here, so they stay.
export function useAutoClear(value: unknown, clear: () => void, ms = 4000) {
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(clear, ms);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
