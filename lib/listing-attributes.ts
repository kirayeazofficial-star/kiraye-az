import { rentalCategorySpecs, rentalSpecs } from "./rental-category-specs";
import type { Listing } from "./marketplace";
export function readListingAttributes(
  category: string,
  form: FormData,
): NonNullable<Listing["attributes"]> {
  const vehicle = ["brand", "model", "color", "condition"];
  const keys: Record<string, string[]> = {
    car: [
      ...vehicle,
      "driver_service",
      "fuel",
      "engine_cc",
      "gearbox",
      "body_type",
      "drivetrain",
      "is_new",
      "mileage_km",
      "min_driver_age",
      "license_years",
      "included_km_day",
    ],
    motorcycle: [
      ...vehicle.filter((key) => key !== "condition"),
      "is_new",
      "engine_cc",
      "gearbox",
      "min_driver_age",
      "license_years",
      "included_km_day",
    ],
    bicycle: [...vehicle, "kind", "frame_size", "wheel_size"],
    equipment: ["kind", "brand", "model", "condition"],
    event: ["kind", "condition", "capacity"],
    property: ["kind", "building_type", "repair", "floor", "total_floors"],
    villa: ["kind"],
    commercial: ["kind"],
  };
  if (rentalCategorySpecs[category]) {
    keys[category] = ["kind", "brand", "model", "condition",
      ...(category === "clothing" ? ["color"] : []),
      ...(rentalSpecs(category, String(form.get("kind") || ""))?.fields.map(field => field.key) || []),
    ];
  }
  const attributes: NonNullable<Listing["attributes"]> = Object.fromEntries(
    [
      ...(keys[category] || []),
      "contact_name",
      "return_terms",
      ...(["property", "villa", "commercial"].includes(category)
        ? ["utilities"]
        : ["delivery_method", "delivery_fee", "included_items"]),
    ]
      .filter((key) => form.has(key) && String(form.get(key)).trim())
      .map((key) => [key, String(form.get(key)).trim()]),
  );
  if (attributes.power_source !== "Akkumulyator") delete attributes.battery_voltage;
  if (!["Çatdırılma", "Hər ikisi"].includes(attributes.delivery_method || ""))
    delete attributes.delivery_fee;
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
  const minimum = Number(form.get("min_days") || 1);
  const unit = String(form.get("min_rental_unit") || "day");
  if (
    Number.isInteger(minimum) &&
    minimum >= 1 &&
    ["day", "month", "year"].includes(unit)
  ) {
    attributes.min_rental_value = String(minimum);
    attributes.min_rental_unit = unit;
  }
  return attributes;
}
export function validateListingAttributes(
  category: string,
  attributes: NonNullable<Listing["attributes"]>,
) {
  if (rentalCategorySpecs[category]) {
    if (!attributes.kind) return "Məhsulun növünü seçin.";
    const spec = rentalSpecs(category, attributes.kind);
    if (!spec && attributes.kind !== "Digər" &&
      !(category === "equipment" && ["Tikinti alətləri", "Foto və video", "Səs və işıq", "Kompüter və elektronika"].includes(attributes.kind)))
      return "Bu kateqoriyaya uyğun məhsul növünü seçin.";
    if ((attributes.brand?.length || 0) > 40 || (attributes.model?.length || 0) > 60)
      return "Marka maksimum 40, model maksimum 60 simvol ola bilər.";
    for (const field of spec?.fields || []) {
      const value = attributes[field.key];
      if (value === undefined || value === "") continue;
      if (field.options && !field.options.includes(String(value)))
        return `${field.label}: siyahıdan seçim edin.`;
      if (field.min !== undefined &&
        (!Number.isFinite(Number(value)) || Number(value) < field.min || Number(value) > field.max! ||
          (field.step === "1" && !Number.isInteger(Number(value)))))
        return `${field.label}: ${field.min}–${field.max} aralığında düzgün rəqəm yazın.`;
      if (typeof value === "string" && value.length > 100)
        return `${field.label}: maksimum 100 simvol yazın.`;
    }
  }
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
  if (
    attributes.delivery_fee !== undefined &&
    (!Number.isFinite(Number(attributes.delivery_fee)) ||
      Number(attributes.delivery_fee) < 0 ||
      Number(attributes.delivery_fee) > 1000000)
  )
    return "Çatdırılma haqqını düzgün yazın.";
  for (const [key, min, max] of [
    ["min_driver_age", 18, 100],
    ["license_years", 0, 80],
    ["included_km_day", 1, 5000],
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
      return "Mühərrik, yürüş, yaş, staj, tutum və mərtəbə məlumatlarını düzgün yazın.";
  }
  if (
    attributes.floor &&
    attributes.total_floors &&
    Number(attributes.floor) > Number(attributes.total_floors)
  )
    return "Mərtəbə binanın ümumi mərtəbə sayından çox ola bilməz.";
  return null;
}
