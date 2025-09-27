// Static place labels for the Atlas map.
// NOTE: Only adding label information; no base layer or map type changes.
// Coordinates are [longitude, latitude]. Altitude will be computed relative to ground by Cesium.

export interface PlaceLabel {
  id: string;
  name: string;
  coordinates: [number, number]; // [lon, lat]
  description?: string;
  type?: string; // e.g., village, district, forest-area
}

// Example set (replace/extend with real data as needed)
export const PLACE_LABELS: PlaceLabel[] = [
  // Core reference city
  {
    id: "place-udaipur",
    name: "Udaipur",
    coordinates: [73.7125, 24.5854],
    type: "city",
    description: "Udaipur City",
  },
  // Sample forest / administrative reference points (expand with real data later)
  {
    id: "place-forest-area-1",
    name: "Forest Area 1",
    coordinates: [73.7, 24.6],
    type: "forest",
    description: "Sample Forest Region",
  },
  {
    id: "place-forest-area-2",
    name: "Forest Area 2",
    coordinates: [73.74, 24.63],
    type: "forest",
  },
  {
    id: "place-forest-area-3",
    name: "Forest Ridge",
    coordinates: [73.69, 24.57],
    type: "forest",
  },
  {
    id: "place-revenue-circle-1",
    name: "Revenue Circle 1",
    coordinates: [73.68, 24.62],
    type: "revenue",
    description: "Administrative revenue boundary",
  },
  {
    id: "place-revenue-circle-2",
    name: "Revenue Circle 2",
    coordinates: [73.76, 24.64],
    type: "revenue",
  },
  {
    id: "place-cfr-area-1",
    name: "CFR Area 1",
    coordinates: [73.72, 24.61],
    type: "cfr",
    description: "Community Forest Rights Area",
  },
  {
    id: "place-cfr-area-2",
    name: "CFR Zone East",
    coordinates: [73.73, 24.59],
    type: "cfr",
  },
  // Settlement / village style points
  {
    id: "place-village-a",
    name: "Village A",
    coordinates: [73.705, 24.595],
    type: "village",
  },
  {
    id: "place-village-b",
    name: "Village B",
    coordinates: [73.715, 24.605],
    type: "village",
  },
  {
    id: "place-village-c",
    name: "Village C",
    coordinates: [73.725, 24.575],
    type: "village",
  },
  {
    id: "place-village-d",
    name: "Village D",
    coordinates: [73.735, 24.615],
    type: "village",
  },
  {
    id: "place-village-e",
    name: "Village E",
    coordinates: [73.695, 24.585],
    type: "village",
  },
  // Landmarks (generic placeholders)
  {
    id: "place-watch-point-1",
    name: "Watch Point",
    coordinates: [73.708, 24.608],
    type: "landmark",
  },
  {
    id: "place-water-body-1",
    name: "Water Body",
    coordinates: [73.722, 24.588],
    type: "water",
  },
];
