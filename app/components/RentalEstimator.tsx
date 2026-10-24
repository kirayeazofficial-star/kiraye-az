"use client";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { useEffect, useState } from "react";
import { type Listing, money, periodName } from "../../lib/marketplace";
import DurationField from "./DurationField";
import { minimumRentalLabel } from "../../lib/rental-details";
import { normalizePhone } from "../../lib/rental-details";
import {
  addRentalDays,
  calculateRental,
  minimumRentalEnd,
  rentalMonthEnd,
  validRentalDate,
} from "../../lib/rental-estimate";
export default function RentalEstimator({ item }: { item: Listing }) {
  const [today, setToday] = useState("");
  const [start, setStart] = useState("");
  const initialUnit =
    item.attributes?.min_rental_unit === "month" ||
    item.attributes?.min_rental_unit === "year" ||
    item.rental_period === "monthly"
      ? "month"
      : item.rental_period === "weekly" ? "week" : "day";
  const [durationUnit, setDurationUnit] = useState(initialUnit);
  const [duration, setDuration] = useState(
    String(
      item.attributes?.min_rental_unit === "year"
        ? Number(item.attributes.min_rental_value || 1) * 12
        : item.attributes?.min_rental_unit === "month"
          ? item.attributes.min_rental_value || 1
          : initialUnit === "day"
            ? item.min_days || 1
            : initialUnit === "week" ? Math.max(1,Math.ceil((item.min_days || 1)/7)) : 1,
    ),
  );
  const [delivery, setDelivery] = useState(false);
  useEffect(() => {
    const now = new Date();
    const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const first =
      item.available_from && item.available_from > value
        ? item.available_from
        : value;
    setToday(value);
    setStart(first);
    if (
      initialUnit === "month" &&
      !["month", "year"].includes(item.attributes?.min_rental_unit || "")
    ) {
      let minimumMonths = 1;
      while (
        minimumMonths < 120 &&
        rentalMonthEnd(first, minimumMonths) < minimumRentalEnd(item, first)
      )
        minimumMonths++;
      setDuration(String(minimumMonths));
    }
  }, [item.id, item.available_from, item.min_days]);
  const phone = normalizePhone(item.contact || "");
  const canDeliver = ["Çatdırılma", "Hər ikisi"].includes(
    item.attributes?.delivery_method || "",
  );
  const deliveryRequired = item.attributes?.delivery_method === "Çatdırılma";
  const includeDelivery = canDeliver && (deliveryRequired || delivery);
  const count = Number(duration);
  const end =
    validRentalDate(start) &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= (durationUnit === "month" ? 120 : 3650)
      ? durationUnit === "month"
        ? rentalMonthEnd(start, count)
        : addRentalDays(start, count * (durationUnit === "week" ? 7 : 1))
      : "";
  const quote =
    !Number.isInteger(count) ||
    count < 1 ||
    count > (durationUnit === "month" ? 120 : 3650)
      ? { error: "Müddəti yalnız rəqəmlə yaz: ən çox 3650 gün və ya 120 ay." }
      : item.rental_period === "monthly" && durationUnit !== "month"
        ? {
            error:
              "Bu elanda yalnız aylıq qiymət göstərilib. Günlük kirayə qiymətini elan sahibi ilə dəqiqləşdir və ya ay seç.",
          }
        : calculateRental(
            item,
            { start, end, months: count, delivery: includeDelivery },
            today,
          );
  const dateLabel = (value: string) => value.split("-").reverse().join(".");
  const message =
    quote.error === null
      ? `Salam, “${item.title}” elanını ${dateLabel(quote.start)}–${dateLabel(quote.end)} tarixləri üçün kirayələmək istəyirəm. ${duration} ${durationUnit === "month" ? "ay" : durationUnit === "week" ? "həftə" : "gün"}${durationUnit === "month" && !quote.monthly ? ` (${quote.units} ${periodName(item.rental_period)} hesabı)` : ""}: ${money(quote.rental)} AZN, depozit: ${money(quote.deposit)} AZN.${includeDelivery ? ` Çatdırılma istəyirəm (${quote.delivery === null ? "qiyməti razılaşdıraq" : `${money(quote.delivery)} AZN`}).` : ""} Bu tarixlər uyğundur? Son qiymət və qaytarılma şərtlərini dəqiqləşdirək.`
      : "";
  return (
    <section className="rentalEstimator" aria-label="Kirayə xərcini hesabla">
      <h3>Kirayə xərcini hesabla</h3>
      <p className="estimateIntro">
        Nə qədər müddətə lazımdır? Rəqəmi yaz, gün, həftə və ya ay seç.
      </p>
      <p className="minimumDurationNote">
        Elan sahibinin minimum müddəti:{" "}
        <strong>{minimumRentalLabel(item)}</strong>. Daha qısa müddəti sahibi
        ilə razılaşdırmalısan.
      </p>
      <div className="estimateFields">
        <DurationField
          label="Kirayə müddəti"
          name="estimate_duration"
          value={duration}
          onValueChange={setDuration}
          unit={durationUnit}
          onUnitChange={setDurationUnit}
        />
        <AzerbaijaniDateInput label="Götürmə tarixi" value={start} min={item.available_from && item.available_from > today ? item.available_from : today || undefined} max={item.available_until || undefined} onChange={setStart} />
      </div>
      {end && <p>Qaytarma: {dateLabel(end)}</p>}
      {item.rental_period === "daily" && durationUnit === "month" && (
        <p className="estimateNote">
          Aylıq tarif göstərilməyib. Hesab seçilən ayların faktiki gün sayı ×{" "}
          {money(item.price)} ₼ günlük qiymət əsasında aparılır; ayrıca aylıq
          endirim daxil deyil.
        </p>
      )}
      {canDeliver && (
        <label className="estimateDelivery">
          <input
            type="checkbox"
            checked={includeDelivery}
            disabled={deliveryRequired}
            onChange={(event) => setDelivery(event.target.checked)}
          />{" "}
          {deliveryRequired
            ? "Çatdırılma ilə təhvil verilir"
            : "Çatdırılma istəyirəm"}
        </label>
      )}
      <div aria-live="polite" className="estimateResult">
        {quote.error !== null ? (
          <div>
            <p className="notice">
              {quote.error}{" "}
              {end && end < minimumRentalEnd(item, start)
                ? "Seçdiyin müddət bu elanın minimumundan qısadır."
                : ""}
            </p>
            {phone && !item.demo && end && (
              <a
                className="secondary"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(`Salam, “${item.title}” elanını ${duration} ${durationUnit === "month" ? "ay" : durationUnit === "week" ? "həftə" : "gün"} müddətinə kirayə götürmək istəyirəm. Bu müddət mümkündürmü? Qiyməti və şərtləri dəqiqləşdirək.`)}`}
              >
                Seçilən müddəti sahibi ilə dəqiqləşdir
              </a>
            )}
          </div>
        ) : (
          <>
            <dl>
              <div>
                <dt>
                  Kirayə · {duration} {durationUnit === "month" ? "ay" : durationUnit === "week" ? "həftə" : "gün"}
                  {durationUnit === "month" && !quote.monthly
                    ? ` (${quote.units} ${periodName(item.rental_period)} hesabı)`
                    : ""}
                </dt>
                <dd>{money(quote.rental)} ₼</dd>
              </div>
              <div>
                <dt>Depozit (ayrıca)</dt>
                <dd>{money(quote.deposit)} ₼</dd>
              </div>
              {includeDelivery && (
                <div>
                  <dt>Çatdırılma</dt>
                  <dd>
                    {quote.delivery === null
                      ? "Razılaşma ilə"
                      : `${money(quote.delivery)} ₼`}
                  </dd>
                </div>
              )}
              <div className="estimateTotal">
                <dt>
                  {quote.delivery === null
                    ? "Məlum xərclərin cəmi"
                    : includeDelivery ? "Kirayə + depozit + çatdırılma" : "Kirayə + depozit"}
                </dt>
                <dd>{money(quote.total)} ₼</dd>
              </div>
            </dl>
            {quote.deposit > 0 && <p className="estimateNote">Depozitin qaytarılma şərtlərini elan sahibi ilə razılaşdır.</p>}
            {includeDelivery && quote.delivery === null && <p className="estimateNote" role="status">Çatdırılma haqqı göstərilməyib və hesaba daxil deyil. Elan sahibi ilə dəqiqləşdir.</p>}
            {phone && !item.demo && (
              <a
                className="add"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`}
              >
                Tarixləri WhatsApp-la soruş
              </a>
            )}
          </>
        )}
      </div>
      <p className="estimateNote">
        Bu hesab rezervasiya deyil. Tarixləri, son qiyməti və depozitin
        qaytarılmasını sahibi ilə razılaşdır.{" "}
        {item.rental_period === "monthly"
          ? "Aylıq qiymət təqvim ayı üzrə hesablanır."
          : "Qaytarma günü ayrıca tam gün kimi sayılmır."}{" "}
      </p>
    </section>
  );
}
