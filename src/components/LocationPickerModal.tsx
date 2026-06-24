import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Search, Loader2, MapPin } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { searchPlaces, reverseGeocode, type GeoResult } from "../lib/geocode";
import { useTranslation } from "../i18n/context";

export interface PickedLocation {
  label: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  initial?: { lat?: number; lng?: number; label?: string };
  onConfirm: (loc: PickedLocation) => void;
  onClose: () => void;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerModal({
  initial,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const { t } = useTranslation();
  const startLat = initial?.lat ?? 12.9716;
  const startLng = initial?.lng ?? 77.5946;

  const [query, setQuery] = useState(initial?.label ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number }>({
    lat: startLat,
    lng: startLng,
  });
  const [label, setLabel] = useState(initial?.label ?? "");
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = async () => {
    if (query.trim().length < 3) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await searchPlaces(query, controller.signal);
      setResults(res);
    } catch {
      // aborted or network error — ignore
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: GeoResult) => {
    setPos({ lat: r.lat, lng: r.lng });
    setLabel(r.label);
    setResults([]);
  };

  const onMapPick = async (lat: number, lng: number) => {
    setPos({ lat, lng });
    const name = await reverseGeocode(lat, lng).catch(() => null);
    if (name) setLabel(name);
  };

  return (
    <Modal onClose={onClose} className="max-w-lg" labelledBy="locpick-title">
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
        <h3
          id="locpick-title"
          className="font-serif font-bold text-lg text-neutral-900"
        >
          {t("modals.pinLocation")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 rounded-md hover:bg-neutral-200"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              autoFocus
              placeholder={t("modals.searchPlacePlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={runSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("common.search")
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickResult(r)}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-brand-50 flex items-start gap-2 border-b border-neutral-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-64 rounded-xl overflow-hidden border border-neutral-200 relative z-0">
          <MapContainer
            center={[pos.lat, pos.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Recenter lat={pos.lat} lng={pos.lng} />
            <ClickHandler onPick={onMapPick} />
            <Marker position={[pos.lat, pos.lng]} />
          </MapContainer>
        </div>
        <p className="text-xs text-neutral-500">
          {label ? (
            <span className="text-neutral-700">{label}</span>
          ) : (
            t("modals.dropPinHint")
          )}
        </p>
      </div>

      <div className="p-4 bg-white border-t border-neutral-100 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          onClick={() =>
            onConfirm({
              label: label || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`,
              lat: pos.lat,
              lng: pos.lng,
            })
          }
          className="shadow-md shadow-brand-700/20"
        >
          {t("modals.confirmLocation")}
        </Button>
      </div>
    </Modal>
  );
}
