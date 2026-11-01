export function maskContact(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 5) return "***";
  return value.replace(/\d(?=(?:\D*\d){0,3}\D*$)/g, "*");
}

export function formatContact(value:string){const digits=value.replace(/\D/g,"");const local=digits.startsWith('994')?digits.slice(3):digits.startsWith('0')?digits.slice(1):digits;return local.length===9?`+994 ${local.slice(0,2)} ${local.slice(2,5)} ${local.slice(5,7)} ${local.slice(7)}`:value;}

export function partiallyHiddenContact(value:string){return formatContact(value).replace(/\d(?=(?:\D*\d){0,1}\D*$)/g,'*');}
