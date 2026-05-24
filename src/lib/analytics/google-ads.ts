export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || "";

export function gtagConversion(value?: number, currency: string = "UAH"): void {
  if (typeof window === "undefined" || !window.gtag) return;
  if (!GOOGLE_ADS_ID || !GOOGLE_ADS_CONVERSION_LABEL) return;
  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
    value: value ?? 0,
    currency,
  });
}
