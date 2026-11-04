// Own copy keeps validation in the selected site language instead of the browser's language.
export function fieldValidationMessage(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, label: string) {
  const validity = field.validity, input = field as HTMLInputElement;
  label = label.replace(/\s*\*\s*/g, "").trim();
  if (validity.valueMissing) return `${label}: bu sahəni doldurun.`;
  if (validity.tooShort) return `${label}: ən azı ${input.minLength} simvol daxil edin.`;
  if (validity.tooLong) return `${label}: ən çox ${input.maxLength} simvol daxil edin.`;
  if (validity.rangeUnderflow) return `${label}: dəyər ən azı ${input.min} olmalıdır.`;
  if (validity.rangeOverflow) return `${label}: dəyər ən çox ${input.max} olmalıdır.`;
  if (validity.badInput) return `${label}: düzgün rəqəm daxil edin.`;
  if (validity.stepMismatch) return `${label}: ${input.step || "1"} addımına uyğun rəqəm daxil edin.`;
  if (validity.typeMismatch || validity.patternMismatch) return `${label}: düzgün formatda məlumat daxil edin.`;
  return `${label}: məlumatı yoxlayıb yenidən daxil edin.`;
}
