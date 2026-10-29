// Small line illustrations for empty sections (cabinet tabs, cards, history, messages, favourites).
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const accent = { ...base, stroke: "var(--kz-accent)" };

export default function EmptyArt({ kind }: { kind: "listings" | "card" | "history" | "chat" | "heart" }) {
  return <svg className="kzEmptyArt" viewBox="0 0 160 112" width="160" height="112" aria-hidden="true">
    <path {...base} strokeDasharray="4 6" d="M14 98h132" />
    {kind === "listings" && <>
      <path {...base} d="M48 98V58l32-24 32 24v40" />
      <path {...base} d="M40 64l40-30 40 30" />
      <rect {...base} x="70" y="72" width="20" height="26" rx="2" />
      <circle {...accent} cx="124" cy="28" r="8" />
      <path {...accent} d="M102 82l9 9M110 76a10 10 0 1 1-20 0 10 10 0 0 1 20 0" transform="translate(16 -12)" />
    </>}
    {kind === "card" && <>
      <rect {...base} x="34" y="34" width="80" height="52" rx="8" />
      <path {...base} d="M34 50h80M46 72h22" />
      <path {...accent} d="M112 54l14 5v11c0 9-6 15-14 18-8-3-14-9-14-18V59z" />
      <path {...accent} d="M106 70l4 4 8-8" />
    </>}
    {kind === "history" && <>
      <circle {...base} cx="62" cy="58" r="26" />
      <path {...base} d="M62 44v14l10 6" />
      <path {...accent} d="M100 46h30M100 60h22M100 74h26" />
    </>}
    {kind === "chat" && <>
      <path {...base} d="M30 36h62a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H56l-14 12V78H30a8 8 0 0 1-8-8V44a8 8 0 0 1 8-8z" />
      <path {...accent} d="M108 50h24a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6h-4v9l-10-9h-10a6 6 0 0 1-6-6V56a6 6 0 0 1 6-6z" />
      <path {...base} d="M40 56h40M40 66h26" />
    </>}
    {kind === "heart" && <>
      <path {...base} d="M80 92S42 70 42 46a18 18 0 0 1 38-6 18 18 0 0 1 38 6c0 24-38 46-38 46z" />
      <path {...accent} d="M124 22v10M119 27h10M36 26v8M32 30h8" />
    </>}
  </svg>;
}
