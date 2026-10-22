const paths: Record<string, string> = {
  property: "M3 11 12 3l9 8M5 10v11h14V10M9 21v-7h6v7",
  car: "m5 8 2-5h10l2 5M3 10h18v9H3zM3 14h3m12 0h3M6 19v2m12-2v2",
  motorcycle:
    "M5 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 17l5-8h5l4 8M8 6h4m1-3h3l3 10M9 17h5",
  villa: "M3 12 12 4l9 8M5 11v10h14V11M9 21v-7h6v7M18 3v5M3 3v3M1.5 4.5h3",
  commercial:
    "M5 21V3h14v18M2 21h20M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3",
  equipment:
    "m14 5 5 5M5 20l-2-2L16 5l3-2 2 2-2 3ZM7 4l3 3M3 8l3 3m8 5 5 5 2-2-5-5",
  bicycle:
    "M5 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 17l4-9 5 9H5Zm9 0 4-12h3M7 5h4m-2 3h9",
  clothing: "m8 3 4 3 4-3 5 4-3 4-2-2v12H8V9l-2 2-3-4 5-4Z",
  electric: "M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 18h9l5-13h-4M11 3 8 8h4l-2 5",
  photo: "M3 7h5l2-3h4l2 3h5v14H3V7Zm9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  camping: "M2 21 12 3l10 18H2Zm6 0 4-9 4 9M10 3l4 1",
  event: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM20 2v4m-2-2h4",
};
export default function CategoryIcon({ id }: { id: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[id] || paths.property} />
    </svg>
  );
}
