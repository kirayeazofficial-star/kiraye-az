"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { formatContact } from "../../lib/contact-mask";
// "Nömrəni göstər" on a store page: the number shows on tap, then becomes a call link.
export default function StorePhone({ phone }: { phone: string }) {
  const [shown, setShown] = useState(false);
  return shown ? <a className="kzButton kzIconBtn kzStoreCall shown" href={`tel:${phone}`}><Phone aria-hidden="true" size={17} strokeWidth={2.2} />{formatContact(phone)}</a>
    : <button type="button" className="kzButton kzIconBtn kzStoreCall" onClick={() => setShown(true)}><Phone aria-hidden="true" size={17} strokeWidth={2.2} />Nömrəni göstər</button>;
}
