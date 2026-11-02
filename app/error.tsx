"use client";
import { House, RotateCw, TriangleAlert } from "lucide-react";
import StatusCard from "./components/StatusCard";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="kzScPage">
    <StatusCard tone="danger" icon={TriangleAlert} badge="Texniki xəta" title="Səhifə yüklənmədi"
      lead="Texniki səbəbdən səhifəni açmaq mümkün olmadı. Bir neçə saniyədən sonra yenidən cəhd edin. Problem təkrarlanarsa, kirayeal.az@gmail.com ünvanına yazın."
      actions={[{ label: "Yenidən yoxla", icon: RotateCw, primary: true, onClick: reset }, { href: "/", label: "Ana səhifə", icon: House }]} />
  </main>;
}
