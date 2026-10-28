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
    return "Bu e-poçtla artıq qeydiyyatdan keçmisən. Daxil ol və ya şifrəni yenilə.";
  if (
    code === "email_address_not_authorized" ||
    /email.*not authorized/i.test(message)
  )
    return "Bu ünvana məktub göndərilə bilmədi. Xidmətin e-poçt göndəriş ayarları yoxlanmalıdır.";
  if (code === "email_address_invalid")
    return "E-poçt ünvanını yoxla və yenidən yaz.";
  if (code === "over_email_send_rate_limit")
    return "E-poçt göndəriş limiti dolub. Hesabın artıq varsa, yenidən qeydiyyat yaratmadan daxil ol. Məktub üçün bir müddət gözlə.";
  if (/^Çox sayda/.test(message)) return message;
  if (e?.status === 429 || code.includes("rate_limit"))
    return "Çox sayda cəhd edildi. Bir qədər gözləyib yenidən yoxla.";
  if (
    code === "phone_provider_disabled" ||
    code === "sms_send_failed" ||
    /phone.*not enabled|sms.*provider|unsupported phone provider|error sending.*sms|failed to send.*sms/i.test(
      message,
    )
  )
    return "SMS xidməti hazırda əlçatan deyil. E-poçtla davam et və ya sonra yoxla.";
  if (/error sending|failed to send|smtp/i.test(message))
    return "Təsdiq məktubu göndərilə bilmədi. Saytın e-poçt göndəriş xidməti yoxlanmalıdır. Bu cəhdlə qeydiyyatın tamamlandığı təsdiqlənmir.";
  if (code === "phone_number_invalid") return "Düzgün mobil nömrə yaz.";
  if (code === "otp_disabled")
    return "SMS ilə giriş hələ aktiv deyil. E-poçtla davam edə bilərsən.";
  if (
    code === "otp_expired" ||
    /token.*expired|token.*invalid|otp.*expired/i.test(message)
  )
    return "Kod və ya link düzgün deyil, yaxud vaxtı bitib. Yenisini istə.";
  if (code === "same_password")
    return "Yeni şifrə əvvəlki şifrədən fərqli olmalıdır.";
  if (code === "reauthentication_needed")
    return "Yeni bərpa linki istəyib şifrəni yenidən təyin et.";
  if (code === "weak_password")
    return "Daha güclü şifrə seç: ən azı 8 simvol istifadə et.";
  if (/fetch|network|timeout|abort|Bağlantı gecikir/i.test(e?.message ?? ""))
    return "Bağlantı qurulmadı. İnternetini yoxlayıb yenidən cəhd et.";
  return "Sorğu tamamlanmadı. Bir az sonra yenidən yoxla.";
}
export function safeLoginDestination(next: string | null) {
  if (
    next &&
    (["/new", "/profile", "/account", "/admin"].includes(next) ||
      /^\/edit\/[0-9a-f-]{36}$/i.test(next))
  )
    return next;
  return "/profile";
}
