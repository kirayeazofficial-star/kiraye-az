import Link from "next/link";
export default function Footer() {
  return (
    <footer>
      <div>
        <Link href="/" className="logo">
          kiraye<span>.az</span>
        </Link>
        <p>Ehtiyacın olanı almalı deyilsən.</p>
      </div>
      <div>
        <Link href="/new">Elan yerləşdir</Link>
        <Link href="/profile">Şəxsi kabinet</Link>
        <Link href="/rules">Qaydalar və təhlükəsizlik</Link>
        <small>© {new Date().getFullYear()} kiraye.az</small>
      </div>
    </footer>
  );
}
