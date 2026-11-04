import { Heart, House, MessageCircle, Plus, UserRound } from "lucide-react";

const icons = { home: House, heart: Heart, chat: MessageCircle, user: UserRound, plus: Plus };
type Name = keyof typeof icons;

// The same outline family and stroke weight in navigation, menus and the cabinet.
export default function TabIcon({ name, active = false, size = 24 }: { name: Name; active?: boolean; size?: number }) {
  const Icon = icons[name];
  return <Icon className={`kzTabIcon${active ? " on" : ""}`} aria-hidden="true" size={size} strokeWidth={active ? 2.2 : 1.8} fill="none" />;
}
