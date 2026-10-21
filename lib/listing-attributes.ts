import type { Listing } from "./marketplace";
export function readListingAttributes(
  category: string,
  form: FormData,
): NonNullable<Listing["attributes"]> {
  const vehicle = ["brand", "model", "color", "condition"];
  const keys: Record<string, string[]> = {
    car: [
      ...vehicle,
      "fuel",
      "engine_cc",
      "gearbox",
      "body_type",
      "drivetrain",
      "is_new",
      "mileage_km",
    ],
    motorcycle: [...vehicle, "engine_cc", "gearbox"],
    bicycle: [...vehicle, "kind", "frame_size", "wheel_size"],
    equipment: ["kind", "brand", "model", "condition"],
    event: ["kind", "condition", "capacity"],
    property: ["kind", "building_type", "repair", "floor", "total_floors"],
    villa: ["kind"],
    commercial: ["kind"],
  };
  const attributes: NonNullable<Listing["attributes"]> = Object.fromEntries(
    [...(keys[category] || []), "contact_name"]
      .filter((key) => form.has(key) && String(form.get(key)).trim())
      .map((key) => [key, String(form.get(key)).trim()]),
  );
  if (category === "car" && attributes.fuel === "Elektrik")
    delete attributes.engine_cc;
  if (category === "property" && attributes.kind !== "Mənzil") {
    delete attributes.building_type;
    delete attributes.repair;
    delete attributes.floor;
    delete attributes.total_floors;
  }
  if (["car", "motorcycle"].includes(category) && form.get("year"))
    attributes.year = Number(form.get("year"));
  if (["property", "villa", "commercial"].includes(category))
    attributes.amenities = form.getAll("amenities").map(String);
  return attributes;
}
export function validateListingAttributes(
  category: string,
  attributes: NonNullable<Listing["attributes"]>,
) {
  if (
    ["car", "motorcycle", "bicycle"].includes(category) &&
    (!attributes.brand || !attributes.model)
  )
    return "Marka və modeli seçin.";
  if (category === "car") {
    if (
      ![
        attributes.color,
        attributes.fuel,
        attributes.gearbox,
        attributes.body_type,
        attributes.drivetrain,
        attributes.is_new,
        attributes.year,
      ].every(Boolean)
    )
      return "Avtomobilin rəngini, yanacağını, sürətlər qutusunu, kuzovunu, ötürücüsünü, ilini və vəziyyətini seçin.";
    if (attributes.mileage_km === undefined)
      return "Avtomobilin yürüşünü yazın.";
    if (attributes.fuel !== "Elektrik" && !attributes.engine_cc)
      return "Mühərrik həcmini yazın.";
    if (attributes.is_new === "Yeni" && Number(attributes.mileage_km) !== 0)
      return "Yeni avtomobilin yürüşü 0 km olmalıdır.";
  }
  if (
    attributes.year !== undefined &&
    (!Number.isInteger(attributes.year) ||
      attributes.year < 1900 ||
      attributes.year > new Date().getFullYear() + 1)
  )
    return "Buraxılış ilini düzgün seçin.";
  for (const [key, min, max] of [
    ["engine_cc", 1, 20000],
    ["mileage_km", 0, 10000000],
    ["capacity", 1, 100000],
    ["floor", 1, 200],
    ["total_floors", 1, 200],
  ] as const) {
    const value = attributes[key];
    if (
      value !== undefined &&
      (!Number.isInteger(Number(value)) ||
        Number(value) < min ||
        Number(value) > max)
    )
      return "Mühərrik, yürüş, tutum və mərtəbə məlumatlarını düzgün yazın.";
  }
  if (
    attributes.floor &&
    attributes.total_floors &&
    Number(attributes.floor) > Number(attributes.total_floors)
  )
    return "Mərtəbə binanın ümumi mərtəbə sayından çox ola bilməz.";
  return null;
}
