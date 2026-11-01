import { ClipboardList, CreditCard, History, LogOut, Plus, Search, Wallet } from "lucide-react";
import TabIcon from "./TabIcon";
// One icon family across the site: home, heart, messages and account use the drawn icons of the bottom
// menu (TabIcon) everywhere — header, cabinet, menus, cards; the rest are Lucide with the same stroke.
const drawn = { home: "home", heart: "heart", message: "chat", account: "user" } as const;
const icons = { plus: Plus, search: Search, history: History, wallet: Wallet, card: CreditCard, limits: ClipboardList, logout: LogOut };
type IconName = keyof typeof drawn | keyof typeof icons;
export default function NavigationIcon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  if (name in drawn) return <TabIcon name={drawn[name as keyof typeof drawn]} active={filled} />;
  const Icon = icons[name as keyof typeof icons];
  return <Icon aria-hidden="true" size={22} strokeWidth={1.75} />;
}
