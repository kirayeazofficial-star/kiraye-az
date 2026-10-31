"use client";
import { useState } from "react";
import type { Listing } from "../../lib/marketplace";
import { isProperty } from "../../lib/rental-details";
import { SelectField } from "./ListingCategoryFields";
// Ready sentences for the most common terms; they only fill the text, which stays editable.
const itemTerms = [
  "Depozit əşya qaytarılanda tam geri verilir.",
  "Gecikən hər gün üçün günlük kirayə haqqı tutulur.",
  "Zədə olarsa, təmir xərci depozitdən çıxılır.",
  "Əşya təmiz və tam dəstlə qaytarılmalıdır.",
  "24 saat əvvəl xəbər verməklə pulsuz ləğv etmək olar.",
];
const propertyTerms = [
  "Depozit çıxış zamanı, əmlak yoxlanandan sonra qaytarılır.",
  "Kommunal ödənişlər çıxışdan əvvəl hesablanır.",
  "Zərər olarsa, təmir xərci depozitdən çıxılır.",
  "Erkən çıxış barədə ən azı 15 gün əvvəl xəbər verilməlidir.",
  "Ev heyvanı razılaşma ilə.",
];
export default function RentalTermsFields({
  category,
  attributes,
}: {
  category: string;
  attributes?: Listing["attributes"];
}) {
  const [method, setMethod] = useState(attributes?.delivery_method || "");
  const [terms, setTerms] = useState(String(attributes?.return_terms || ""));
  return (
    <div className="rentalTermsFields">
      {isProperty(category) ? (
        <SelectField
          name="utilities"
          label="Kommunal xərclər"
          options={["Qiymətə daxildir", "Ayrıca ödənilir", "Razılaşma ilə"]}
          value={attributes?.utilities}
        />
      ) : (
        <>
          <SelectField
            name="delivery_method"
            label="Təhvil / çatdırılma"
            options={["Özün götür", "Hər ikisi"]}
            value={method}
            onChange={setMethod}
          />
          {["Çatdırılma", "Hər ikisi"].includes(method) && (
            <label>
              Çatdırılma haqqı (₼)
              <div className="currencyControl"><input
                aria-label="Çatdırılma haqqı (₼)"
                name="delivery_fee"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                defaultValue={attributes?.delivery_fee}
                placeholder="0 — pulsuz; boş — razılaşma ilə"
              /><span aria-hidden="true">₼</span></div>
            </label>
          )}
          <label>
            Qiymətə nə daxildir?
            <input
              name="included_items"
              maxLength={250}
              defaultValue={attributes?.included_items}
              placeholder={
                category === "bicycle"
                  ? "Məsələn: dəbilqə, kilid"
                  : category === "equipment"
                    ? "Məsələn: çanta, batareya, şarj cihazı"
                    : "Əlavə verilən əşyalar"
              }
            />
          </label>
        </>
      )}
      {["car", "motorcycle"].includes(category) && (
        <div className="formGrid">
          <label>
            Sürücünün minimum yaşı
            <input
              name="min_driver_age"
              type="number"
              min="18"
              max="100"
              defaultValue={attributes?.min_driver_age}
            />
          </label>
          <label>
            Tələb olunan sürücülük stajı (il)
            <input
              name="license_years"
              type="number"
              min="0"
              max="80"
              defaultValue={attributes?.license_years}
            />
          </label>
          <label>
            Günlük yürüş limiti (km)
            <input
              name="included_km_day"
              type="number"
              min="1"
              max="5000"
              defaultValue={attributes?.included_km_day}
              placeholder="Boş saxla — sahibindən dəqiqləşdirilsin"
            />
          </label>
        </div>
      )}
      <label>
        Qaytarılma və ləğv şərtləri
        <textarea
          name="return_terms"
          maxLength={450}
          rows={3}
          value={terms}
          onChange={(event) => setTerms(event.target.value)}
          placeholder="Depozit nə vaxt qaytarılır? Gecikmə, zərər və ləğv necə razılaşdırılır?"
        />
      </label>
      <div className="kzTermChips" aria-label="Hazır şərtlər">
        <span>Hazır şərtlər — toxunun, mətnə əlavə olunsun:</span>
        {(isProperty(category) ? propertyTerms : itemTerms).map((term) => {
          const used = terms.includes(term);
          return <button key={term} type="button" className={used ? "on" : ""} aria-pressed={used}
            onClick={() => setTerms((current) => used ? current.replace(term, "").replace(/\s{2,}/g, " ").trim() : `${current.trim()} ${term}`.trim().slice(0, 450))}>{term}</button>;
        })}
      </div>
    </div>
  );
}
