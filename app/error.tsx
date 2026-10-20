"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="wrap">
      <section className="empty">
        <h1>Səhifə yüklənmədi</h1>
        <p>Yenidən cəhd et və ya bir az sonra qayıt.</p>
        <button className="add" onClick={reset}>
          Yenidən yoxla
        </button>
      </section>
    </main>
  );
}
