import Link from "next/link";
export default function Header() {
  return (
    <>
      <div className="topbar">
        <div>
          Azərbaycanın kirayə platforması <span>Almağa tələsmə. Kirayələ.</span>
        </div>
      </div>
      <header className="header">
        <Link className="logo" href="/">
          kiraye<span>.az</span>
          <small>KİRAYƏ ÜÇÜN BİR ÜNVAN</small>
        </Link>
        <nav aria-label="Əsas menyu">
          <Link href="/#elanlar">Elanlar</Link>
          <a href="/?favorites=1#elanlar">♡ Seçilmişlər</a>
          <Link href="/profile">Şəxsi kabinet</Link>
        </nav>
        <div className="headerActions">
          <Link className="accountLink" href="/login">
            Daxil ol
          </Link>
          <Link className="add" href="/new">
            + Elan yerləşdir
          </Link>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <Link href="/">
          ⌂<span>Ana səhifə</span>
        </Link>
        <a href="/?favorites=1#elanlar">
          ♡<span>Seçilmişlər</span>
        </a>
        <Link className="mobilePublish" href="/new">
          +<span>Elan yerləşdir</span>
        </Link>
        <Link href="/profile">
          ◎<span>Hesabım</span>
        </Link>
      </nav>
    </>
  );
}
