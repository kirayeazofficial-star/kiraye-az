"use client";
import { useEffect, useState } from "react";
import { type Listing, money } from "../../lib/marketplace";
import { normalizePhone } from "../../lib/rental-details";
import { addRentalDays, calculateRental } from "../../lib/rental-estimate";
export default function RentalEstimator({ item }: { item: Listing }) {
  const [today, setToday] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [months, setMonths] = useState("1");
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
    setEnd(addRentalDays(first, item.min_days || 1));
  }, [item.id, item.available_from, item.min_days]);
  const phone = normalizePhone(item.contact || "");
  const canDeliver = ["Çatdırılma", "Hər ikisi"].includes(
    item.attributes?.delivery_method || "",
  );
  const deliveryRequired = item.attributes?.delivery_method === "Çatdırılma";
  const includeDelivery = canDeliver && (deliveryRequired || delivery);
  const quote = calculateRental(
    item,
    { start, end, months: Number(months), delivery: includeDelivery },
    today,
  );
  const dateLabel = (value: string) => value.split("-").reverse().join(".");
  const message =
    quote.error === null
      ? `Salam, “${item.title}” elanını ${dateLabel(quote.start)}–${dateLabel(quote.end)} tarixləri üçün kirayələmək istəyirəm. ${quote.units} ${quote.monthly ? "ay" : "gün"}: ${money(quote.rental)} AZN, depozit: ${money(quote.deposit)} AZN.${includeDelivery ? ` Çatdırılma istəyirəm (${quote.delivery === null ? "qiyməti razılaşdıraq" : `${money(quote.delivery)} AZN`}).` : ""} Bu tarixlər uyğundur? Son qiymət və qaytarılma şərtlərini dəqiqləşdirək.`
      : "";
  return (
    <section className="rentalEstimator" aria-label="Kirayə xərcini hesabla">
      <h3>Kirayə xərcini hesabla</h3>
      <div className="estimateFields">
        <label>
          Götürmə tarixi
          <input
            aria-label="Götürmə tarixi"
            type="date"
            value={start}
            min={
              item.available_from && item.available_from > today
                ? item.available_from
                : today || undefined
            }
            max={item.available_until || undefined}
            onChange={(event) => {
              setStart(event.target.value);
              setEnd(addRentalDays(event.target.value, item.min_days || 1));
            }}
          />
        </label>
        {item.rental_period === "monthly" ? (
          <label>
            Ay sayı
            <input
              aria-label="Ay sayı"
              type="number"
              min="1"
              max="120"
              step="1"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            />
          </label>
        ) : (
          <label>
            Qaytarma tarixi
            <input
              aria-label="Qaytarma tarixi"
              type="date"
              value={end}
              min={addRentalDays(start, item.min_days || 1) || undefined}
              max={item.available_until || undefined}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        )}
      </div>
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
          <p className="notice">{quote.error}</p>
        ) : (
          <>
            {quote.monthly && <p>Qaytarma: {dateLabel(quote.end)}</p>}
            <dl>
              <div>
                <dt>
                  Kirayə · {quote.units} {quote.monthly ? "ay" : "gün"}
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
                    : "İlkin hesab"}
                </dt>
                <dd>{money(quote.total)} ₼</dd>
              </div>
            </dl>
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
        {quote.error === null && quote.delivery === null
          ? "Çatdırılma haqqı cəmə daxil deyil."
          : ""}
      </p>
    </section>
  );
}
