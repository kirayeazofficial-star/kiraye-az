import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

export default function Feedback({ children, id, tone = "error" }: { children: ReactNode; id?: string; tone?: "error" | "success" | "info" }) {
  const Icon = tone === "success" ? CircleCheck : tone === "info" ? Info : CircleAlert;
  return <div className="kzFeedback" data-tone={tone} id={id} role={tone === "error" ? "alert" : "status"} aria-atomic="true">
    <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
    <span>{children}</span>
  </div>;
}
