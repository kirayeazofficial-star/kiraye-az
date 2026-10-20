export function authErrorMessage(error: unknown) {
  const e = error as {
    code?: string | number;
    status?: number;
    message?: string;
  };
  const code = typeof e?.code === "string" ? e.code : "";
  const message = e?.message ?? "";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message))
    return "E-poçtun hələ təsdiqlənməyib. Aşağıdan yeni təsdiq məktubu istəyə bilərsən.";
  if (
    code === "invalid_credentials" ||
    /invalid login credentials/i.test(message)
  )
    return "E-poçt və ya şifrə düzgün deyil. Mövcud hesabının şifrəsini yaz və ya şifrəni yenilə.";
  if (code === "user_already_exists")
    return "Bu e-poçtla hesab artıq var. Daxil ol və ya şifrəni yenilə.";
  if (e?.status === 429 || code.includes("rate_limit"))
    return "Çox sayda cəhd edildi. Bir qədər gözləyib yenidən yoxla.";
  if (code === "otp_expired")
    return "Kodun və ya linkin vaxtı bitib. Yeni təsdiq məktubu istə.";
  if (code === "weak_password")
    return "Daha güclü şifrə seç: ən azı 8 simvol istifadə et.";
  if (/fetch|network|timeout/i.test(e?.message ?? ""))
    return "Bağlantı qurulmadı. İnternetini yoxlayıb yenidən cəhd et.";
  return "Sorğu tamamlanmadı. Bir az sonra yenidən yoxla.";
}
export function safeLoginDestination(next: string | null) {
  if (
    next &&
    (["/new", "/profile", "/account"].includes(next) ||
      /^\/edit\/[0-9a-f-]{36}$/i.test(next))
  )
    return next;
  return "/profile";
}
