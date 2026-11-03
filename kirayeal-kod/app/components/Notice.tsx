"use client";
import { useEffect } from "react";
import { toast, type NoticeKind } from "../../lib/toast";

// The caller selects the result kind; wording never decides whether a failed action succeeded.
export default function Notice({ text, kind }: { text: string | null | undefined; kind?: NoticeKind }) {
  useEffect(() => { if (text) toast(text, { kind: kind ?? "success" }); }, [text, kind]);
  return null;
}
