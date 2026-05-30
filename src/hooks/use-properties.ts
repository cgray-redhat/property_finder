"use client";

import { useCallback, useState } from "react";
import type { PropertySummary } from "@/lib/api/properties";
import { PROPERTIES_API_BASE } from "@/lib/api/properties";

type UsePropertiesResult = {
  properties: PropertySummary[];
  isLoading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
};

/** Client hook for loading property listings from the API. */
export function useProperties(): UsePropertiesResult {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(PROPERTIES_API_BASE);
      if (!response.ok) {
        throw new Error(`Failed to load properties (${response.status})`);
      }
      const data = (await response.json()) as PropertySummary[];
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { properties, isLoading, error, fetchProperties };
}
