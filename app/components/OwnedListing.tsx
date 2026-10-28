"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { finishWithin } from "../../lib/auth-return";
import type { Listing } from "../../lib/marketplace";
import PromotionOptions from "./PromotionOptions";
import ListingDetails from "./ListingDetails";
export default function OwnedListing({ id }: { id: string }) {
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const response=await fetch(`/api/listings?id=${encodeURIComponent(id)}`,{cache:'no-store'}),result=await response.json();
      if (!response.ok || !result.item)
        throw new Error("Bu elan tapılmadı və ya sənin hesabına aid deyil.");
      if (active) setItem(result.item as Listing);
    }
    finishWithin(load(), 20000)
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return loading ? (
    <p role="status">Elan yüklənir...</p>
  ) : item ? (
    <>
      <p className="notice">
        Şəxsi önbaxış: bu elan{" "}
        {item.status === "pending" ? "yoxlamadadır" : "kabinetindədir"}. Yalnız
        yayımlanmış elanlar hamıya göstərilir.
      </p>
      <ListingDetails item={item} />
      <PromotionOptions eligible={item.status === "published"} listingId={item.id} />
    </>
  ) : (
    <section className="empty">
      <p role="alert">{error}</p>
      <Link className="secondary" href="/profile">
        Elanlarıma qayıt
      </Link>
      <Link
        href={`/login?next=${encodeURIComponent(`/profile/listings/${id}`)}`}
      >
        Hesaba daxil ol
      </Link>
    </section>
  );
}
