import { useIsDark } from "@/hooks/useIsDark";
import type { GeoPoint, NearbyHospital } from "@/types/hospital";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const selectedIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#0d9488;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

L.Marker.prototype.options.icon = defaultIcon;

type HospitalLocatorMapProps = {
  userLocation: GeoPoint;
  hospitals: NearbyHospital[];
  rangeKm: number;
  selectedPlaceId: string | null;
  zoom?: number;
};

function FitMapToPoints({ points, zoom }: { points: L.LatLngExpression[]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1 && zoom != null) {
      map.setView(points[0], zoom);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.12), { maxZoom: 15 });
  }, [map, points, zoom]);
  return null;
}

export function HospitalLocatorMap({
  userLocation,
  hospitals,
  rangeKm,
  selectedPlaceId,
  zoom = 14,
}: HospitalLocatorMapProps) {
  const isDark = useIsDark();
  const userLatLng: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const hospitalPoints = hospitals
    .filter((h) => h.latitude != null && h.longitude != null)
    .map((h) => [h.latitude!, h.longitude!] as L.LatLngExpression);

  const allPoints: L.LatLngExpression[] = [userLatLng, ...hospitalPoints];

  return (
    <MapContainer
      center={userLatLng}
      zoom={zoom}
      scrollWheelZoom
      className="h-full min-h-[320px] w-full rounded-2xl border border-slate-200 shadow-inner dark:border-slate-700"
      aria-label="Map showing hospitals near you"
    >
      <TileLayer key={tileUrl} attribution={tileAttribution} url={tileUrl} />
      <FitMapToPoints points={allPoints} zoom={zoom} />
      <Circle
        center={userLatLng}
        radius={rangeKm * 1000}
        pathOptions={{ color: "#0d9488", fillColor: "#14b8a6", fillOpacity: 0.08, weight: 2 }}
      />
      <Marker position={userLatLng} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {hospitals.map((h) => {
        if (h.latitude == null || h.longitude == null) return null;
        const pos: L.LatLngExpression = [h.latitude, h.longitude];
        const isSelected = h.placeId === selectedPlaceId;
        return (
          <Marker key={h.placeId} position={pos} icon={isSelected ? selectedIcon : defaultIcon}>
            <Popup>
              <span className="font-semibold">{h.name}</span>
              {h.distanceKm != null ? (
                <span className="block text-xs text-slate-600 dark:text-slate-300">{h.distanceKm.toFixed(1)} km away</span>
              ) : null}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
