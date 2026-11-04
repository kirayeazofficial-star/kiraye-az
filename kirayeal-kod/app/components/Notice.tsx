"use client";
import { useEffect } from "react";
import { toast } from "../../lib/toast";

// Turns a page's short result message into the floating toast (green, or red for a failure),
// so it never stays stuck on the page. Renders nothing itself.
const failure = /mümkün olmadı|alınmadı|olmalıdır|göndərilmir|silinmədi|saxlanmadı|xəta/i;
export default function Notice({ text, kind }: { text: string | null | undefined; kind?: "success" | "error" }) {
  useEffect(() => { if (text) toast(text, { kind: kind ?? (failure.test(text) ? "error" : "success") }); }, [text, kind]);
  return null;
}
