import { Heart, House, MessageCircle, Plus, UserRound } from "lucide-react";

const icons = { home: House, heart: Heart, chat: MessageCircle, user: UserRound, plus: Plus };
type Name = keyof typeof icons;

// The same outline family and stroke weight in navigation, menus and the cabinet.
export default function TabIcon({ name, active = false, size = 24, solid = false }: { name: Name; active?: boolean; size?: number; solid?: boolean }) {
  if (solid && name !== "plus") return <svg className={`kzTabIcon kzTabSolid${active ? " on" : ""}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {name === "home" && <path fill="currentColor" stroke="none" fillRule="evenodd" d="M2.5 10.2 12 2.5l9.5 7.7-1.5 1.9-1-.8V21h-5v-7h-4v7H5v-9.7l-1 .8z" />}
    {name === "heart" && <path fill="currentColor" stroke="none" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.8-7.6 1.1-1a5.5 5.5 0 0 0-.1-7.8Z" />}
    {name === "chat" && <><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.7 15L2 22l5-1.3A10 10 0 1 0 12 2Z" /><path fill="#fff" stroke="none" d="M6 11h3v2H6zm4.5 0h3v2h-3zm4.5 0h3v2h-3z" /></>}
    {name === "user" && <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><circle cx="12" cy="8.5" r="3" fill="#fff" stroke="none" /><path d="M6 18a6 5 0 0 1 12 0 8 8 0 0 1-12 0Z" fill="#fff" stroke="none" /></>}
  </svg>;
  const Icon = icons[name];
  return <Icon className={`kzTabIcon${active ? " on" : ""}`} aria-hidden="true" size={size} strokeWidth={active ? 2.2 : 1.8} fill="none" />;
}
