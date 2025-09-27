// Mapbox service helpers for Isochrone & Directions APIs.
// NOTE: For production, move secret calls server-side to avoid exposing tokens (use a backend proxy).
// These are client-side demo stubs YOU SHOULD NOT SHIP with a secret token.

export interface IsochroneParams {
  profile?: "driving" | "walking" | "cycling";
  minutes: number;            // travel time in minutes
  center: [number, number];   // lng, lat
  accessToken: string;
}

export async function fetchIsochroneGeoJSON(params: IsochroneParams) {
  const { profile = "driving", minutes, center, accessToken } = params;
  // Mapbox Isochrone API: https://docs.mapbox.com/api/navigation/isochrone/
  const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${center[0]},${center[1]}?contours_minutes=${minutes}&polygons=true&generalize=50&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Isochrone fetch failed");
  return res.json();
}

export interface DirectionsParams {
  profile?: "driving" | "walking" | "cycling";
  origin: [number, number];
  destination: [number, number];
  accessToken: string;
}

export async function fetchRouteGeoJSON(params: DirectionsParams) {
  const { profile = "driving", origin, destination, accessToken } = params;
  // Directions API: https://docs.mapbox.com/api/navigation/directions/
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Directions fetch failed");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route found");
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: route.geometry,
        properties: {
          distance_km: +(route.distance / 1000).toFixed(2),
          duration_min: +(route.duration / 60).toFixed(1),
        },
      },
    ],
  };
}