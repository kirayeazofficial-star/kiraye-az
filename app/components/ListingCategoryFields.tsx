"use client";
import { rentalCategorySpecs, rentalSpecs } from "../../lib/rental-category-specs";
import { useState } from "react";
import type { Listing } from "../../lib/marketplace";
import { amenities, isProperty } from "../../lib/rental-details";
import {
  carModels,
  motorcycleModels,
  bicycleModels,
  equipmentModels,
  colors,
  vehicleColors,
} from "../../lib/listing-form-options";
type Attributes = Listing["attributes"];
export function SelectField({
  name,
  label,
  options,
  value,
  required = false,
  onChange,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label>
      {label}
      {required && <span className="requiredMark"> *</span>}
      <select
        aria-label={label}
        name={name}
        required={required}
        defaultValue={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Seçin</option>
        {value && !options.includes(value) && <option>{value}</option>}
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function BrandModelPicker({
  models,
  attributes,
  required = false,
  suggest,
}: {
  models: Record<string, string[]>;
  attributes?: Attributes;
  required?: boolean;
  suggest?: (title: string) => void;
}) {
  const known = attributes?.brand && Object.prototype.hasOwnProperty.call(models, attributes.brand);
  const [brand, setBrand] = useState(
    known ? attributes!.brand! : attributes?.brand ? "__other__" : "",
  );
  const [otherBrand, setOtherBrand] = useState(
    known ? "" : attributes?.brand || "",
  );
  const [model, setModel] = useState(
    attributes?.model &&
      known &&
      models[attributes!.brand!].includes(attributes.model)
      ? attributes.model
      : attributes?.model
        ? "__other__"
        : "",
  );
  const [otherModel, setOtherModel] = useState(attributes?.model || "");
  const resolvedBrand = brand === "__other__" ? otherBrand.trim() : brand;
  const resolvedModel = model === "__other__" ? otherModel.trim() : model;
  function notify(b: string, m: string) {
    if (b) suggest?.(`${b} ${m} kirayəsi`.replace(/\s+/g, " "));
  }
  return (
    <>
      <input type="hidden" name="brand" value={resolvedBrand} />
      <input type="hidden" name="model" value={resolvedModel} />
      <div className="formGrid">
        <label>
          Marka{required && <span className="requiredMark"> *</span>}
          <select
            aria-label="Marka"
            required={required}
            value={brand}
            onChange={(event) => {
              const next = event.target.value;
              setBrand(next);
              setOtherBrand("");
              setModel("");
              setOtherModel("");
              notify(next === "__other__" ? "" : next, "");
            }}
          >
            <option value="">Markanı seçin</option>
            {Object.keys(models)
              .sort((a, b) => a.localeCompare(b, "az"))
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
            <option value="__other__">Digər marka</option>
          </select>
        </label>
        <label>
          Model{required && <span className="requiredMark"> *</span>}
          <select
            aria-label="Model"
            required={required}
            value={model}
            disabled={!resolvedBrand}
            onChange={(event) => {
              setModel(event.target.value);
              setOtherModel("");
              notify(
                resolvedBrand,
                event.target.value === "__other__" ? "" : event.target.value,
              );
            }}
          >
            <option value="">
              {resolvedBrand ? "Modeli seçin" : "Əvvəl markanı seçin"}
            </option>
            {(Object.prototype.hasOwnProperty.call(models, resolvedBrand) ? models[resolvedBrand] : []).map((item) => (
              <option key={item}>{item}</option>
            ))}
            <option value="__other__">Digər model</option>
          </select>
        </label>
      </div>
      {(brand === "__other__" || model === "__other__") && (
        <div className="formGrid">
          {brand === "__other__" && (
            <label>
              Digər marka
              <input
                aria-label="Digər marka"
                required
                maxLength={40}
                value={otherBrand}
                onChange={(event) => {
                  setOtherBrand(event.target.value);
                  notify(event.target.value, resolvedModel);
                }}
                placeholder="Markanın adını yaz"
              />
            </label>
          )}
          {model === "__other__" && (
            <label>
              Digər model
              <input
                aria-label="Digər model"
                required
                maxLength={60}
                value={otherModel}
                onChange={(event) => {
                  setOtherModel(event.target.value);
                  notify(resolvedBrand, event.target.value);
                }}
                placeholder="Modelin adını yaz"
              />
            </label>
          )}
        </div>
      )}
    </>
  );
}
export default function ListingCategoryFields({
  category,
  initial,
  suggest,
}: {
  category: string;
  initial: Listing | null;
  suggest: (value: string) => void;
}) {
  const attributes =
    initial?.category === category ? initial.attributes : undefined;
  if (isProperty(category))
    return (
      <PropertyFields
        category={category}
        initial={initial?.category === category ? initial : null}
      />
    );
  if (["car", "motorcycle", "bicycle"].includes(category))
    return (
      <VehicleFields
        category={category}
        attributes={attributes}
        suggest={suggest}
      />
    );
  return (
    <ItemFields category={category} attributes={attributes} suggest={suggest} />
  );
}
function VehicleFields({
  category,
  attributes,
  suggest,
}: {
  category: string;
  attributes?: Attributes;
  suggest: (value: string) => void;
}) {
  const car = category === "car",
    bicycle = category === "bicycle";
  const [fuel, setFuel] = useState(attributes?.fuel || "");
  const [isNew, setIsNew] = useState(attributes?.is_new || "");
  const [mileage, setMileage] = useState(attributes?.is_new === "Yeni" ? "0" : attributes?.mileage_km || "");
  const years = Array.from(
    { length: new Date().getFullYear() - 1898 },
    (_, i) => String(new Date().getFullYear() + 1 - i),
  );
  return (
    <section className="categoryFields" aria-label="Kateqoriya məlumatları">
      <BrandModelPicker
        models={car ? carModels : bicycle ? bicycleModels : motorcycleModels}
        attributes={attributes}
        required
        suggest={suggest}
      />
      <div className="formGrid">
        <SelectField
          name="color"
          label="Rəng"
          options={bicycle ? colors : vehicleColors}
          value={attributes?.color}
          required={car}
        />
        {car ? (
          <SelectField
            name="fuel"
            label="Yanacaq növü"
            options={[
              "Benzin",
              "Dizel",
              "Hibrid",
              "Plug-in hibrid",
              "Elektrik",
              "Qaz",
            ]}
            value={fuel}
            required
            onChange={setFuel}
          />
        ) : !bicycle ? (
          <SelectField
            name="is_new"
            label="Yeni / işlənmiş"
            options={["Yeni", "İşlənmiş"]}
            value={isNew}
            required
            onChange={(value) => {
              setIsNew(value);
              setMileage(value === "Yeni" ? "0" : "");
            }}
          />
        ) : (
          <SelectField
            name="condition"
            label="Vəziyyət"
            options={["Əla", "Yaxşı", "Qənaətbəxş"]}
            value={attributes?.condition}
          />
        )}
      </div>
      {!bicycle && (
        <>
          <div className="formGrid">
            {fuel !== "Elektrik" && (
              <label>
                Mühərrik, sm³{car && <span className="requiredMark"> *</span>}
                <input
                  aria-label="Mühərrik, sm³"
                  name="engine_cc"
                  type="number"
                  min="1"
                  max="20000"
                  required={car}
                  defaultValue={attributes?.engine_cc}
                  placeholder="Məsələn: 1600"
                />
              </label>
            )}
            <SelectField
              name="gearbox"
              label="Sürətlər qutusu"
              options={["Avtomat", "Mexaniki", "Variator", "Robotlaşdırılmış"]}
              value={attributes?.gearbox}
              required={car}
            />
          </div>
          {car && (
            <div className="formGrid">
              <SelectField
                name="body_type"
                label="Kuzov növü"
                options={[
                  "Sedan",
                  "Hetçbek",
                  "Universal",
                  "SUV / Krossover",
                  "Kupe",
                  "Kabriolet",
                  "Minivan",
                  "Mikroavtobus",
                  "Pikap",
                  "Furqon",
                  "Digər",
                ]}
                value={attributes?.body_type}
                required
              />
              <SelectField
                name="drivetrain"
                label="Ötürücü növü"
                options={["Ön", "Arxa", "Tam"]}
                value={attributes?.drivetrain}
                required
              />
            </div>
          )}
          <div className="formGrid">
            <SelectField
              name="year"
              label="Buraxılış ili"
              options={years}
              value={attributes?.year ? String(attributes.year) : ""}
              required={car}
            />
            {car && (
              <SelectField
                name="is_new"
                label="Yeni / işlənmiş"
                options={["Yeni", "İşlənmiş"]}
                value={isNew}
                required
                onChange={(value) => {
                  setIsNew(value);
                  setMileage(value === "Yeni" ? "0" : "");
                }}
              />
            )}
          </div>
          {!bicycle && (
            <label>
              Yürüş, km<span className="requiredMark"> *</span>
              <input
                aria-label="Yürüş, km"
                name="mileage_km"
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={8}
                required
                value={mileage}
                readOnly={isNew === "Yeni"}
                onChange={(event) => setMileage(event.target.value)}
                placeholder="Məsələn: 85000"
              />
            </label>
          )}
        </>
      )}
      {car && (
        <SelectField
          name="driver_service"
          label="Sürücü xidməti (istəyə bağlı)"
          options={["Sürücüsüz", "Sürücülü", "Hər iki variant"]}
          value={attributes?.driver_service}
        />
      )}
      {bicycle && (
        <>
          <SelectField
            name="kind"
            label="Velosiped növü"
            options={[
              "Dağ",
              "Şəhər",
              "Şosse",
              "BMX",
              "Elektrikli",
              "Qatlanan",
              "Uşaq",
              "Digər",
            ]}
            value={attributes?.kind}
            required
          />
          <div className="formGrid">
            <SelectField
              name="frame_size"
              label="Çərçivə ölçüsü"
              options={["XS", "S", "M", "L", "XL", "XXL", "Uşaq", "Digər"]}
              value={attributes?.frame_size}
            />
            <SelectField
              name="wheel_size"
              label="Təkər ölçüsü"
              options={[
                "12 düym",
                "14 düym",
                "16 düym",
                "18 düym",
                "20 düym",
                "24 düym",
                "26 düym",
                "27.5 düym",
                "28 düym",
                "29 düym",
                "Digər",
              ]}
              value={attributes?.wheel_size}
            />
          </div>
        </>
      )}
    </section>
  );
}
function PropertyFields({
  category,
  initial,
}: {
  category: string;
  initial: Listing | null;
}) {
  const attributes = initial?.attributes;
  const [kind, setKind] = useState(attributes?.kind || "");
  return (
    <section className="categoryFields" aria-label="Kateqoriya məlumatları">
      <SelectField
        name="kind"
        label={category === "commercial" ? "Obyektin növü" : "Əmlakın növü"}
        options={
          category === "commercial"
            ? ["Ofis", "Mağaza", "Anbar", "Qaraj", "Obyekt", "Digər"]
            : category === "villa"
              ? ["Villa", "Bağ evi", "Kottec", "Digər"]
              : ["Mənzil", "Həyət evi", "Otaq", "Digər"]
        }
        value={kind}
        onChange={setKind}
      />
      <div className="formGrid">
        {category !== "commercial" && (
          <label>
            Otaq sayı
            <input
              name="rooms"
              type="number"
              min="1"
              max="100"
              defaultValue={initial?.rooms}
            />
          </label>
        )}
        <label>
          Sahə (m²)
          <input
            name="area_m2"
            type="number"
            min="1"
            max="1000000"
            defaultValue={initial?.area_m2}
          />
        </label>
      </div>
      {category === "property" && kind === "Mənzil" && (
        <div className="formGrid">
          <SelectField
            name="building_type"
            label="Bina növü"
            options={["Yeni tikili", "Köhnə tikili"]}
            value={attributes?.building_type}
          />
          <SelectField
            name="repair"
            label="Təmir"
            options={["Təmirli", "Təmirsiz"]}
            value={attributes?.repair}
          />
          <label>
            Mərtəbə
            <input
              name="floor"
              type="number"
              min="1"
              max="200"
              defaultValue={attributes?.floor}
            />
          </label>
          <label>
            Binada mərtəbə sayı
            <input
              name="total_floors"
              type="number"
              min="1"
              max="200"
              defaultValue={attributes?.total_floors}
            />
          </label>
        </div>
      )}
      <div className="amenitiesField">
        <p>İmkanlar</p>
        {amenities
          .filter((value) => category !== "commercial" || value !== "Hovuz")
          .map((value) => (
            <label className="checkLabel" key={value}>
              <input
                type="checkbox"
                name="amenities"
                value={value}
                defaultChecked={attributes?.amenities?.includes(value)}
              />
              <span>{value}</span>
            </label>
          ))}
      </div>
    </section>
  );
}
function ItemFields({
  category,
  attributes,
  suggest,
}: {
  category: string;
  attributes?: Attributes;
  suggest: (value: string) => void;
}) {
  const [kind, setKind] = useState(attributes?.kind || "");
  const [powerSource, setPowerSource] = useState(String(attributes?.power_source || ""));
  const definition = rentalCategorySpecs[category];
  const spec = rentalSpecs(category, kind);
  const models = spec?.models || (category === "equipment" ? equipmentModels[kind] : undefined) || {};
  const initial = attributes?.kind === kind ? attributes : undefined;
  return (
    <section className="categoryFields" aria-label="Kateqoriya məlumatları">
      <SelectField name="kind" label={definition?.label || "Məhsulun növü"}
        options={Array.from(new Set([...Object.keys(definition?.kinds || {}), ...(category === "equipment" ? Object.keys(equipmentModels) : []), "Digər"]))}
        value={kind} required onChange={(value) => { setKind(value); suggest(value ? `${value} kirayəsi` : ""); setPowerSource(value === attributes?.kind ? String(attributes?.power_source || "") : ""); }} />
      {!kind && <p className="muted">Əvvəl növü seç. Sonra yalnız həmin məhsula uyğun suallar açılacaq.</p>}
      {kind && <div key={kind}>
        {Object.keys(models).length ? <BrandModelPicker models={models} attributes={initial} suggest={suggest} /> : (
          <div className="formGrid">
            <label>Marka (istəyə bağlı)<input name="brand" maxLength={40} defaultValue={initial?.brand} onChange={(event) => suggest(`${event.target.value.trim()} ${kind} kirayəsi`.trim())} placeholder="Markasızdırsa, boş saxla" /></label>
            <label>Model / kolleksiya (istəyə bağlı)<input name="model" maxLength={60} defaultValue={initial?.model} /></label>
          </div>
        )}
        <SelectField name="condition" label="Vəziyyət" options={["Əla", "Yaxşı", "Qənaətbəxş"]} value={initial?.condition} />
        {category === "clothing" && <SelectField name="color" label="Rəng" options={colors} value={initial?.color} />}
        <p className="muted">Əlavə xüsusiyyətlər istəyə bağlıdır. Dəqiq bilmədiyini boş saxla.</p>
        <div className="formGrid">
          {(spec?.fields || []).filter(field => field.key !== "battery_voltage" || powerSource === "Akkumulyator").map(field => field.options ? (
            <SelectField key={field.key} name={field.key} label={field.label} options={field.options} value={String(initial?.[field.key] || "")} onChange={field.key === "power_source" ? setPowerSource : undefined} />
          ) : <label key={field.key}>{field.label}
            <input name={field.key} aria-label={field.label}
              type={field.min === undefined ? "text" : "number"}
              min={field.min} max={field.max} step={field.step}
              maxLength={field.min === undefined ? 100 : undefined}
              defaultValue={initial?.[field.key] as string | undefined}
              placeholder={field.placeholder} />
          </label>)}
        </div>
      </div>}
    </section>
  );
}
