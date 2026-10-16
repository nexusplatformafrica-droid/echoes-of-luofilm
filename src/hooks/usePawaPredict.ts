import { providerFromPhone, type CountryInfo } from "@/lib/countries";

/** Mobile money network for a number, from the national prefix table. */
export function useMomoNetwork(phone: string, country: CountryInfo | null | undefined, enabled = true) {
  const dial = country?.dial ?? "";
  const localLength = country?.localLength ?? 0;
  let digits = phone.replace(/\D/g, "");
  if (dial && digits.startsWith(dial) && digits.length > localLength) digits = digits.slice(dial.length);
  digits = digits.replace(/^0+/, "");
  const complete = enabled && !!dial && digits.length === localLength;
  const name = complete && country ? providerFromPhone(digits, country) : null;
  return { code: name, name, logo: "", checking: false };
}
