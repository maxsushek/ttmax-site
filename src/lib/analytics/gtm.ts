export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

export function pushDataLayer(event: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}
