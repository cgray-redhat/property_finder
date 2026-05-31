"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getCapRateColor } from "@/lib/rank-properties";
import { trackEvent } from "@/lib/analytics";
import {
  useAppMode,
  useLotListings,
  useRankedProperties,
} from "@/hooks/use-ranked-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";
import type { EnrichedPropertyListing } from "@/types/property";
import type { RankedProperty } from "@/lib/rank-properties";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const LOT_PIN_COLOR = "#6366f1";
const PIN_HIT_SIZE_PX = 24;
const PIN_DEFAULT_SIZE_PX = 14;
const PIN_SELECTED_SIZE_PX = 18;

type MappableListing = EnrichedPropertyListing | RankedProperty;

type MarkerRecord = {
  marker: mapboxgl.Marker;
  element: HTMLElement;
  color: string;
};

function getPinColor(listing: MappableListing, isLotMode: boolean): string {
  if (isLotMode) {
    return LOT_PIN_COLOR;
  }

  return getCapRateColor(
    (listing as RankedProperty).underwriting.capRate,
  );
}

function applyPinSelectionStyle(
  element: HTMLElement,
  color: string,
  isSelected: boolean,
): void {
  const size = isSelected ? PIN_SELECTED_SIZE_PX : PIN_DEFAULT_SIZE_PX;

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.backgroundColor = color;
  element.style.outline = isSelected ? `3px solid ${color}` : "none";
  element.style.outlineOffset = "2px";
  element.setAttribute("aria-pressed", isSelected ? "true" : "false");
}

export function DealMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersByIdRef = useRef<Map<string, MarkerRecord>>(new Map());
  const appMode = useAppMode();
  const isLotMode = appMode === "lot_finder";
  const rankedProperties = useRankedProperties();
  const lotListings = useLotListings();
  const mapListings: MappableListing[] = isLotMode
    ? lotListings
    : rankedProperties;
  const selectedPropertyId = useInvestLocateStore(
    (state) => state.selectedPropertyId,
  );
  const setSelectedPropertyId = useInvestLocateStore(
    (state) => state.setSelectedPropertyId,
  );
  const searchResults = useInvestLocateStore((state) => state.searchResults);

  const listingsKey = useMemo(
    () =>
      mapListings
        .map(
          (property) =>
            `${property.id}:${property.latitude}:${property.longitude}`,
        )
        .join("|"),
    [mapListings],
  );

  const mappableCount = mapListings.filter(
    (property) => property.latitude != null && property.longitude != null,
  ).length;

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-97.7431, 30.2672],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersByIdRef.current.forEach(({ marker }) => marker.remove());
      markersByIdRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAPBOX_TOKEN) {
      return;
    }

    markersByIdRef.current.forEach(({ marker }) => marker.remove());
    markersByIdRef.current.clear();

    const mappable = mapListings.filter(
      (property) => property.latitude != null && property.longitude != null,
    );

    if (mappable.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    for (const [index, property] of mappable.entries()) {
      const { longitude, latitude } = property;
      if (longitude == null || latitude == null) {
        continue;
      }

      const color = getPinColor(property, isLotMode);

      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.title = property.formattedAddress;
      markerElement.className =
        "flex cursor-pointer items-center justify-center border-0 bg-transparent p-0";
      markerElement.style.width = `${PIN_HIT_SIZE_PX}px`;
      markerElement.style.height = `${PIN_HIT_SIZE_PX}px`;
      markerElement.style.borderRadius = "9999px";

      const pinDot = document.createElement("span");
      pinDot.className = "block rounded-full border-2 border-white shadow-md";
      pinDot.style.pointerEvents = "none";
      markerElement.appendChild(pinDot);

      applyPinSelectionStyle(pinDot, color, false);

      markerElement.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelectedPropertyId(property.id);
        trackEvent("Property Listing Clicked", {
          property_id: property.id,
          address: property.formattedAddress,
          rank: index + 1,
          zip_code: searchResults?.zipCode ?? null,
          source: "map",
          mode: appMode,
        });
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markersByIdRef.current.set(property.id, {
        marker,
        element: pinDot,
        color,
      });
      bounds.extend([longitude, latitude]);
    }

    map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
  }, [listingsKey, isLotMode, setSelectedPropertyId, searchResults?.zipCode, appMode]);

  useEffect(() => {
    markersByIdRef.current.forEach(({ element, color }, propertyId) => {
      applyPinSelectionStyle(
        element,
        color,
        propertyId === selectedPropertyId,
      );
    });
  }, [selectedPropertyId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <div>
          <h3 className="font-semibold text-zinc-900">Map unavailable</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Set{" "}
            <code className="rounded bg-zinc-200 px-1">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>{" "}
            in your <code className="rounded bg-zinc-200 px-1">.env</code> file to
            enable the Deal Map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
      <div ref={mapContainerRef} className="h-full w-full" />
      {mappableCount === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 p-6 text-center">
          <p className="text-sm text-zinc-600">
            Search a zip code to plot {isLotMode ? "land listings" : "rental properties"} on the map.
          </p>
        </div>
      )}
    </div>
  );
}
