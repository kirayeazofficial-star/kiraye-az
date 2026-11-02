import Link from "next/link";
import { Bike, Camera, Car, Hammer, House, Tag, TreePalm } from "lucide-react";
import { categoryName } from "../../lib/marketplace";

// Main rental groups as small links: used on "not found" and "inactive listing" screens so the visitor stays on the site.
const groups = [{ id: "property", name: "Ev və mənzil", icon: House }, { id: "car", name: "Avtomobil", icon: Car }, { id: "motorcycle", name: "Motosiklet", icon: Bike }, { id: "villa", name: "Villa və bağ", icon: TreePalm }, { id: "equipment", name: "Alətlər və texnika", icon: Hammer }, { id: "photo", name: "Foto və video", icon: Camera }];
export default function QuickCategories({ only }: { only?: string }) {
  const list = only ? [groups.find(group => group.id === only) || { id: only, name: categoryName(only), icon: Tag }] : groups;
  return <nav className="kzScChips" aria-label="Kateqoriyalar">{list.map(({ id, name, icon: Icon }) => <Link key={id} href={`/?category=${id}`}><Icon aria-hidden="true" size={15} strokeWidth={2} />{name}</Link>)}</nav>;
}
