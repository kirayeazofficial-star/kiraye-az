// City pages for search: /kiraye-ev/baki, /kiraye-masin/gence ...
export const seoCities = {
  baki: { name: "Bakı", in: "Bakıda" },
  sumqayit: { name: "Sumqayıt", in: "Sumqayıtda" },
  gence: { name: "Gəncə", in: "Gəncədə" },
  xirdalan: { name: "Xırdalan", in: "Xırdalanda" },
  lenkeran: { name: "Lənkəran", in: "Lənkəranda" },
  seki: { name: "Şəki", in: "Şəkidə" },
  qebele: { name: "Qəbələ", in: "Qəbələdə" },
  quba: { name: "Quba", in: "Qubada" },
  mingecevir: { name: "Mingəçevir", in: "Mingəçevirdə" },
  naxcivan: { name: "Naxçıvan", in: "Naxçıvanda" },
} as const;
export type SeoCitySlug = keyof typeof seoCities;
