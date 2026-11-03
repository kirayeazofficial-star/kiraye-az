import { Heart, House, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="authLayout">
    <aside className="authIntro" aria-label="Hesab imkanları">
      <h2>Kirayə üçün<br /><span>bir ünvan.</span></h2>
      <ul>
        <li><span className="authFeatureIcon home"><House size={22} strokeWidth={1.8} aria-hidden="true" /></span>Elanlarınızı idarə edin</li>
        <li><span className="authFeatureIcon chat"><MessageCircle size={22} strokeWidth={1.8} aria-hidden="true" /></span>Elan sahibi ilə yazışın</li>
        <li><span className="authFeatureIcon favorite"><Heart size={22} strokeWidth={1.8} aria-hidden="true" /></span>Bəyəndiklərinizi yadda saxlayın</li>
      </ul>
    </aside>
    <div className="authFormColumn">{children}</div>
  </div>;
}
