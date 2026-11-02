import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// One card for the site's "state" screens: page not found, listing inactive or under review, no search results,
// listing sent for review, blocked account, loading error. Same look as the maintenance page: a coloured icon,
// a small badge, a heading, formal text, optional checklist / steps and buttons.
export type StatusTone = "accent" | "warn" | "info" | "ok" | "danger";
export type StatusAction = { href?: string; label: string; icon?: LucideIcon; primary?: boolean; onClick?: () => void; external?: boolean };

export default function StatusCard({ tone = "accent", icon: Icon, badge, title, lead, note, list, steps, actions = [], children, as: Heading = "h1", className = "" }: {
  tone?: StatusTone; icon: LucideIcon; badge?: string; title: string; lead?: ReactNode; note?: ReactNode;
  list?: { title: string; items: ReactNode[] }; steps?: { title: string; text: string; done?: boolean; now?: boolean }[];
  actions?: StatusAction[]; children?: ReactNode; as?: "h1" | "h2" | "h3"; className?: string;
}) {
  return <section className={`kzSc ${tone} ${className}`.trim()}>
    <div className="kzScHead">
      <span className="kzScIcon" aria-hidden="true"><Icon size={28} strokeWidth={1.9} /></span>
      <div>{badge && <span className="kzScBadge">{badge}</span>}<Heading>{title}</Heading></div>
    </div>
    {lead && <p className="kzScLead">{lead}</p>}
    {note && <p className="kzScReason">{note}</p>}
    {steps && <ol className="kzScSteps">{steps.map((step, index) => <li key={step.title} className={step.done ? "done" : step.now ? "now" : ""}><b aria-hidden="true">{index + 1}</b><div><strong>{step.title}</strong><span>{step.text}</span></div></li>)}</ol>}
    {list && <div className="kzScList"><strong>{list.title}</strong><ul>{list.items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    {children}
    {!!actions.length && <div className="kzScActions">{actions.map(({ href, label, icon: ActionIcon, primary, onClick, external }) => {
      const body = <>{ActionIcon && <ActionIcon aria-hidden="true" size={17} strokeWidth={2} />}{label}</>, cls = primary ? "kzScBtn primary" : "kzScBtn";
      if (!href) return <button key={label} type="button" className={cls} onClick={onClick}>{body}</button>;
      return external ? <a key={label} className={cls} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{body}</a> : <Link key={label} className={cls} href={href}>{body}</Link>;
    })}</div>}
  </section>;
}
