type AnalyticsEvent =
  | "Property Listing Clicked"
  | "What-If Slider Adjusted";

type EventProperties = Record<string, string | number | boolean | null>;

type PostHogClient = {
  capture: (event: string, properties?: EventProperties) => void;
};

let posthogClient: PostHogClient | null = null;
let initialized = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Initialize PostHog once on the client. Safe to call without env vars configured. */
export async function initAnalytics(): Promise<void> {
  if (!isBrowser() || initialized) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    initialized = true;
    return;
  }

  const { default: posthog } = await import("posthog-js");

  posthog.init(apiKey, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage",
  });

  posthogClient = posthog;
  initialized = true;
}

/** Track a product analytics event. No-ops when PostHog is not configured. */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: EventProperties,
): void {
  if (!isBrowser()) {
    return;
  }

  if (!initialized) {
    void initAnalytics().then(() => {
      posthogClient?.capture(event, properties);
    });
    return;
  }

  posthogClient?.capture(event, properties);
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}
