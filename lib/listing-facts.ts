import type { Listing } from "./marketplace";
import { rentalCategorySpecs } from "./rental-category-specs";

export type KeyFact = { value: string; label: string };
type Attributes = Record<string, unknown>;
const text = (value: unknown) => (value === null || value === undefined ? "" : String(value).trim());

// Up to three headline facts for the price box, chosen per category (as big classified sites do:
// "4 otaqlı · 185 m² · 8/15 mərtəbə").
export function keyFacts(item: Listing): KeyFact[] {
  const a = (item.attributes ?? {}) as Attributes;
  const facts: KeyFact[] = [];
  const add = (value: string, label: string) => { if (value && facts.length < 3) facts.push({ value, label }); };
  if (["property", "villa", "commercial"].includes(item.category)) {
    if (item.rooms) add(`${item.rooms} otaqlı`, text(a.kind).toLowerCase() || "otaq");
    if (item.area_m2) add(`${Number(item.area_m2)} m²`, "sahə");
    if (text(a.floor)) add(text(a.total_floors) ? `${text(a.floor)} / ${text(a.total_floors)}` : text(a.floor), "mərtəbə");
    else if (text(a.total_floors)) add(text(a.total_floors), "mərtəbə sayı");
    if (!item.rooms && text(a.kind)) add(text(a.kind), "növ");
  } else if (item.category === "car") {
    add(text(a.year), "buraxılış ili");
    add(text(a.gearbox), "sürətlər qutusu");
    add(text(a.fuel), "yanacaq");
    add(text(a.body_type), "kuzov");
  } else if (item.category === "motorcycle") {
    add(text(a.year), "buraxılış ili");
    add(text(a.engine_cc) ? `${text(a.engine_cc)} sm³` : "", "mühərrik");
    add(text(a.kind), "növ");
  } else {
    add(text(a.kind), "növ");
    add(text(a.condition), "vəziyyət");
  }
  return facts.length >= 2 ? facts : [];
}

// Quick type filters shown under the categories once one is chosen ("Sedan · SUV · Minivan").
export function typeOptions(category: string): string[] {
  if (category === "property") return ["Mənzil", "Həyət evi", "Otaq"];
  if (category === "villa") return ["Villa", "Bağ evi", "Kottec"];
  if (category === "commercial") return ["Ofis", "Mağaza", "Anbar", "Qaraj", "Ticarət obyekti"];
  if (category === "car") return ["Sedan", "Hetçbek", "Universal", "SUV / Krossover", "Minivan", "Mikroavtobus", "Pikap"];
  const kinds = rentalCategorySpecs[category]?.kinds;
  return kinds ? Object.keys(kinds).filter(kind => kind !== "Digər") : [];
}
