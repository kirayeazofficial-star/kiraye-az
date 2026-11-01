import { ClipboardList, CreditCard, Heart, History, House, LogOut, MessageCircle, Plus, Search, User, Wallet } from "lucide-react";
// One icon set (Lucide) with one stroke width across the site.
const icons = { home: House, heart: Heart, plus: Plus, account: User, search: Search, message: MessageCircle, history: History, wallet: Wallet, card: CreditCard, limits: ClipboardList, logout: LogOut };
type IconName = keyof typeof icons;
export default function NavigationIcon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" size={22} strokeWidth={1.75} fill={filled ? "currentColor" : "none"} />;
}
