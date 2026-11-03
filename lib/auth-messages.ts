export function authErrorMessage(error: unknown) {
  const e = error as {
    code?: string | number;
    status?: number;
    message?: string;
  };
  const code = typeof e?.code === "string" ? e.code : "";
  const message = e?.message ?? "";
  const hostMessages: Record<string, string> = {
    ACCOUNT_EXISTS: "Bu e-poçtla hesab artıq var. «Daxil ol» bölməsindən daxil olun. Şifrənizi unutmusunuzsa, «Şifrəni unutmusunuz?» keçidindən istifadə edin.",
    INVALID_CREDENTIALS: "E-poçt və ya şifrə yanlışdır. Məlumatları yoxlayın və ya şifrənizi bərpa edin.",
    ACCOUNT_BLOCKED: "Hesabınız sayt qaydalarının pozulmasına görə bloklanıb. Sual üçün kirayeal.az@gmail.com ünvanına yazın.",
    EMAIL_NOT_CONFIRMED: "E-poçtunuz hələ təsdiqlənməyib. Aşağıdan yeni təsdiq kodu istəyin.",
    INVALID_CODE: "Kod düzgün deyil və ya vaxtı bitib. Yeni kod istəyin.",
    INVALID_INPUT: "Məlumatları yoxlayın: ad və soyad, düzgün e-poçt, telefon və ən azı 8 simvolluq şifrə yazın.",
    RATE_LIMIT: "Çox sayda cəhd edilib. Bir qədər gözləyib yenidən cəhd edin.",
    TOO_MANY_ATTEMPTS: "Çox sayda uğursuz cəhdə görə giriş müvəqqəti məhdudlaşdırılıb. Bir qədər sonra yenidən cəhd edin və ya şifrənizi bərpa edin.",
    SERVICE_UNAVAILABLE: "Xidmət müvəqqəti əlçatan deyil. Bir az sonra yenidən yoxlayın.",
  };
  if (code && hostMessages[code]) return hostMessages[code];
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message))
    return "E-poçtunuz hələ təsdiqlənməyib. Aşağıdan yeni təsdiq məktubu istəyə bilərsiniz.";
  if (
    code === "invalid_credentials" ||
    /invalid login credentials/i.test(message)
  )
    return "E-poçt və ya şifrə düzgün deyil. Hesabınızın şifrəsini yazın və ya şifrənizi yeniləyin.";
  if (code === "user_already_exists")
    return "Bu e-poçtla artıq qeydiyyatdan keçmisiniz. Daxil olun və ya şifrənizi yeniləyin.";
  if (
    code === "email_address_not_authorized" ||
    /email.*not authorized/i.test(message)
  )
    return "Bu ünvana məktub göndərilə bilmədi. Xidmətin e-poçt göndəriş ayarları yoxlanmalıdır.";
  if (code === "email_address_invalid")
    return "E-poçt ünvanını yoxlayıb yenidən yazın.";
  if (code === "over_email_send_rate_limit")
    return "E-poçt göndəriş limiti dolub. Hesabınız artıq varsa, yenidən qeydiyyatdan keçmədən daxil olun. Yeni məktub üçün bir müddət gözləyin.";
  if (/^Çox sayda/.test(message)) return message;
  if (e?.status === 429 || code.includes("rate_limit"))
    return "Çox sayda cəhd edildi. Bir qədər gözləyib yenidən yoxlayın.";
  if (
    code === "phone_provider_disabled" ||
    code === "sms_send_failed" ||
    /phone.*not enabled|sms.*provider|unsupported phone provider|error sending.*sms|failed to send.*sms/i.test(
      message,
    )
  )
    return "SMS xidməti hazırda əlçatan deyil. E-poçtla daxil olun və ya bir az sonra yoxlayın.";
  if (/error sending|failed to send|smtp/i.test(message))
    return "Təsdiq məktubu göndərilə bilmədi. Saytın e-poçt göndəriş xidməti yoxlanmalıdır. Bu cəhdlə qeydiyyatın tamamlandığı təsdiqlənmir.";
  if (code === "phone_number_invalid") return "Düzgün mobil nömrə yazın.";
  if (code === "otp_disabled")
    return "SMS ilə giriş hələ aktiv deyil. E-poçtla daxil ola bilərsiniz.";
  if (
    code === "otp_expired" ||
    /token.*expired|token.*invalid|otp.*expired/i.test(message)
  )
    return "Kod və ya keçid düzgün deyil, yaxud vaxtı bitib. Yenisini istəyin.";
  if (code === "same_password")
    return "Yeni şifrə əvvəlki şifrədən fərqli olmalıdır.";
  if (code === "reauthentication_needed")
    return "Yeni bərpa kodu istəyib şifrənizi yenidən təyin edin.";
  if (code === "weak_password")
    return "Daha güclü şifrə seçin: ən azı 8 simvol istifadə edin.";
  if (/fetch|network|timeout|abort|Bağlantı gecikir/i.test(e?.message ?? ""))
    return "Bağlantı qurulmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.";
  return "Sorğu tamamlanmadı. Bir az sonra yenidən yoxlayın.";
}
export function safeLoginDestination(next: string | null) {
  if (
    next &&
    (["/new", "/profile", "/account", "/admin", "/messages", "/balance"].includes(next) ||
      /^\/edit\/[0-9a-f-]{36}$/i.test(next))
  )
    return next;
  return "/profile";
}
