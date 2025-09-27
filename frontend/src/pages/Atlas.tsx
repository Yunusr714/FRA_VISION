import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, {
  Map,
  MapLayerMouseEvent,
  LngLatLike,
  LngLat,
  AnySourceData,
} from "mapbox-gl";
import * as turf from "@turf/turf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Layers,
  Settings,
  MapPin,
  HelpCircle,
  Filter,
  Calendar,
  Search,
  Globe2,
  Box,
  Droplets,
  Leaf,
  X,
  PenTool,
  Trash2,
  Route,
  Compass,
  Target,
  RefreshCcw,
  Globe,
  ShieldCheck,
  Move,
  Edit3,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PLACE_LABELS } from "@/data/places";

/* Mapbox Draw & Geocoder CSS (ensure installed) */
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

/* -------------------------------------------------------------
   TYPES & CONFIG
------------------------------------------------------------- */
type ClaimStatus =
  | "approved"
  | "pending"
  | "under-verification"
  | "rejected"
  | "fraud";

interface ClaimAssets {
  ponds: number;
  wells: number;
  farmPlots: number;
  forestPatches: number;
  hasWater: boolean;
  hasForest: boolean;
}

export interface Claim {
  id: string;
  coordinates: [number, number];
  status: ClaimStatus;
  claimant: string;
  area: number; // hectares
  submittedDate: string;
  year: number;
  regionCode: string;
  polygon?: turf.Feature<turf.Polygon>;
  assets: ClaimAssets;
  schemeScore?: number;
}

interface DraftClaim {
  id: string;
  feature: turf.Feature<turf.Polygon | turf.MultiPolygon>;
  areaHa: number;
  centroid: [number, number];
  createdAt: string;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoidmVua2F0YS1rcmlzaG5hIiwiYSI6ImNtZnYycHN0bTAzY28yanFxeG4wOXVsenAifQ.w1yd6XuvWvarYj33rP1LkA"; // dev fallback

const STATUS_SEQUENCE: ClaimStatus[] = [
  "approved",
  "pending",
  "under-verification",
  "rejected",
  "fraud",
];

const REGION_DEFINITIONS = [
  { code: "RJ", name: "Rajasthan Tribal Belt", bbox: [73, 23.5, 75, 25], claims: 3 },
  { code: "WG-N", name: "Western Ghats (Maharashtra)", bbox: [73, 16, 75, 18], claims: 4 },
  { code: "WG-S", name: "Western Ghats (Kerala)", bbox: [76, 9, 77.5, 11.5], claims: 4 },
  { code: "MP-C", name: "Central India (Madhya Pradesh)", bbox: [78, 21, 81, 24], claims: 5 },
  { code: "MH-E", name: "Maharashtra (Gadchiroli)", bbox: [80, 19, 81.5, 20], claims: 3 },
  { code: "CG", name: "Chhattisgarh", bbox: [81, 19, 83.5, 22], claims: 5 },
  { code: "OD", name: "Odisha", bbox: [84, 19, 86.5, 21.5], claims: 4 },
  { code: "JH", name: "Jharkhand", bbox: [84, 23, 86, 24.5], claims: 3 },
  { code: "NE-AS", name: "Assam", bbox: [91, 26, 94, 27.5], claims: 3 },
  { code: "NE-AR", name: "Arunachal Pradesh", bbox: [94, 27, 96, 28.5], claims: 3 },
  { code: "NE-NG", name: "Nagaland", bbox: [94, 25.5, 95.5, 26.5], claims: 3 },
  { code: "GJ-D", name: "Gujarat (Dangs)", bbox: [73.3, 20.5, 73.9, 21.1], claims: 2 },
];

/* -------------------------------------------------------------
   HELPERS
------------------------------------------------------------- */
function createSeededRandom(seed = 2024) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function sampleName(index: number, region: string) {
  const first = [
    "Ravi","Kamla","Mohan","Sita","Lal","Asha","Kalu","Bharti","Ramesh","Nirmala",
    "Sohan","Pooja","Hemant","Deepa","Harish","Gita","Raju","Varsha","Arun","Meena"
  ];
  const last = [
    "Bhil","Dev","Naik","Munda","Kumar","Tudu","Singh","Ekka","Nayak","Oraon",
    "Gond","Bari","Tirkey","Das","Patel","Rawat","Verma","Saw","Bhoi","Pawar"
  ];
  return `${first[index % first.length]} ${last[(index * 3) % last.length]} (${region})`;
}
function areaHaToRadiusMeters(areaHa: number) {
  const areaM2 = areaHa * 10000;
  return Math.sqrt(areaM2 / Math.PI);
}
function generateAssetsForClaim(globalIndex: number, rand: () => number): ClaimAssets {
  const ponds = Math.floor(rand() * 2);
  const wells = Math.floor(rand() * 3);
  const farmPlots = Math.max(1, Math.floor(rand() * 4));
  const forestPatches = Math.floor(rand() * 3);
  return {
    ponds,
    wells,
    farmPlots,
    forestPatches,
    hasWater: ponds + wells > 0,
    hasForest: forestPatches > 0,
  };
}
function generateDistributedClaims(): Claim[] {
  const rand = createSeededRandom(2024);
  const claims: Claim[] = [];
  let globalIndex = 1;
  REGION_DEFINITIONS.forEach((region) => {
    for (let i = 0; i < region.claims; i++) {
      const [minLon, minLat, maxLon, maxLat] = region.bbox;
      const lon = minLon + (maxLon - minLon) * rand();
      const lat = minLat + (maxLat - minLat) * rand();
      const status = STATUS_SEQUENCE[(globalIndex - 1) % STATUS_SEQUENCE.length];
      const area = +(0.8 + rand() * 3.7).toFixed(2);
      const start = new Date("2023-01-01").getTime();
      const end = new Date("2024-12-15").getTime();
      const date = new Date(start + (end - start) * rand());
      const year = date.getFullYear();
      const radiusMeters = areaHaToRadiusMeters(area);
      const circle = turf.circle([lon, lat], radiusMeters, { steps: 40, units: "meters" });
      const assets = generateAssetsForClaim(globalIndex, rand);

      // Mock scheme score 0–100 (priority)
      const schemeScore = Math.round(rand() * 100);

      claims.push({
        id: `FRA-${year}-${String(globalIndex).padStart(4, "0")}`,
        coordinates: [lon, lat],
        status,
        claimant: sampleName(globalIndex, region.code),
        area,
        submittedDate: date.toISOString().split("T")[0],
        year,
        regionCode: region.code,
        polygon: circle as turf.Feature<turf.Polygon>,
        assets,
        schemeScore,
      });
      globalIndex++;
    }
  });
  return claims;
}

const STATUS_COLOR: Record<ClaimStatus, string> = {
  approved: "#16A34A",
  pending: "#F59E0B",
  "under-verification": "#2563EB",
  rejected: "#DC2626",
  fraud: "#8B1E66",
};

const statusColorExpression: any = [
  "match",
  ["get", "status"],
  "approved", STATUS_COLOR.approved,
  "pending", STATUS_COLOR.pending,
  "under-verification", STATUS_COLOR["under-verification"],
  "rejected", STATUS_COLOR.rejected,
  "fraud", STATUS_COLOR.fraud,
  "#6B7280",
];

// NEW FEATURE: Priority ramp styling (schemeScore)
const priorityRampExpression: any = [
  "interpolate",
  ["linear"],
  ["get", "schemeScore"],
  0, "#0f766e",
  30, "#16a34a",
  60, "#eab308",
  80, "#f97316",
  100, "#dc2626",
];

function getStatusBadgeVariant(status: ClaimStatus) {
  switch (status) {
    case "approved":
      return "secondary";
    case "pending":
      return "destructive";
    case "under-verification":
      return "default";
    case "rejected":
    case "fraud":
      return "outline";
    default:
      return "outline";
  }
}

/* Mock asset layers (water + forest) */
function createMockWaterGeoJSON() {
  const features: turf.Feature<turf.Polygon>[] = [];
  const centers = [
    [80.5, 19.7],
    [78.4, 22.3],
    [74.2, 24.2],
  ];
  centers.forEach((c, i) => {
    const poly = turf.circle(c, 600 + i * 200, {
      steps: 50,
      units: "meters",
      properties: { id: `water-${i}` },
    });
    features.push(poly as turf.Feature<turf.Polygon>);
  });
  return turf.featureCollection(features);
}
function createMockForestGeoJSON() {
  const blocks: turf.Feature<turf.Polygon>[] = [];
  const centers = [
    [79.2, 21.5],
    [81.0, 20.2],
    [75.5, 23.4],
  ];
  centers.forEach((c, i) => {
    const poly = turf.circle(c, 4000 + i * 1000, {
      steps: 60,
      units: "meters",
      properties: { id: `forest-${i}` },
    });
    blocks.push(poly as turf.Feature<turf.Polygon>);
  });
  return turf.featureCollection(blocks);
}

/* DSS Schemes */
interface Scheme {
  code: string;
  name: string;
  reason: string;
}
function computeEligibleSchemes(c: Claim): Scheme[] {
  const out: Scheme[] = [];
  if (c.assets.farmPlots > 0 && c.area > 1)
    out.push({ code: "PM-KISAN", name: "PM-KISAN", reason: "Farm usage & area > 1 ha" });
  if (c.assets.ponds + c.assets.wells < 2)
    out.push({ code: "JAL", name: "Jal Jeevan Mission", reason: "Limited water sources" });
  if (c.status !== "approved" || c.area < 2)
    out.push({ code: "MGNREGA", name: "MGNREGA", reason: "Scope for livelihood assets" });
  if (c.assets.forestPatches > 0)
    out.push({ code: "DAJGUA", name: "DAJGUA", reason: "Forest patch potential" });
  return out;
}

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */
const Atlas = () => {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Claim selection
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Panels
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // Filters / toggles
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("2024");
  const [showExtrusions, setShowExtrusions] = useState(true);
  const [showClaimLabels, setShowClaimLabels] = useState(true);
  const [showClaimPolygons, setShowClaimPolygons] = useState(true);
  const [showClaimPoints, setShowClaimPoints] = useState(true);
  const [placeSearch, setPlaceSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showPlaces, setShowPlaces] = useState(true);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [enabledStatuses, setEnabledStatuses] = useState<Set<ClaimStatus>>(
    new Set(["approved", "pending", "under-verification", "rejected", "fraud"])
  );
  const [polygonsOpacity, setPolygonsOpacity] = useState(80);
  const [pointsOpacity, setPointsOpacity] = useState(100);
  const [extrusionScale, setExtrusionScale] = useState(50);
  const [filterRequiresWater, setFilterRequiresWater] = useState(false);
  const [filterRequiresForest, setFilterRequiresForest] = useState(false);
  const [filterRegions, setFilterRegions] = useState<Set<string>>(new Set());

  // Asset layers
  const [showWaterLayer, setShowWaterLayer] = useState(true);
  const [waterOpacity, setWaterOpacity] = useState(60);
  const [showForestLayer, setShowForestLayer] = useState(true);
  const [forestOpacity, setForestOpacity] = useState(35);

  // NEW FEATURE: styling mode (status vs schemeScore ramp)
  const [usePriorityRamp, setUsePriorityRamp] = useState(false);

  // NEW FEATURE: focus-only mode dims other claims
  const [focusSelectedOnly, setFocusSelectedOnly] = useState(false);

  // NEW FEATURE: drawing & draft claims
  const drawRef = useRef<any | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [draftClaims, setDraftClaims] = useState<DraftClaim[]>([]);
  const [activeDrawMode, setActiveDrawMode] = useState<"simple_select" | "draw_polygon" | "draw_rectangle" | "direct_select">("simple_select");

  // NEW FEATURE: geocoder
  const geocoderControlRef = useRef<any | null>(null);
  const [geocoderEnabled, setGeocoderEnabled] = useState(false);

  // NEW FEATURE: isochrone & route
  const [isochroneMinutes, setIsochroneMinutes] = useState(60);
  const [isochroneActive, setIsochroneActive] = useState(false);
  const [routeActive, setRouteActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<[number, number] | null>(null);
  const [routeDestination, setRouteDestination] = useState<[number, number] | null>(null);
  const [fetchingIso, setFetchingIso] = useState(false);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  // Pulse animation
  const pulseRef = useRef<boolean>(false);
  const pulseIntervalRef = useRef<number | null>(null);

  const { eli5Mode } = useAppStore();

  /* Data */
  const claims = useMemo(() => generateDistributedClaims(), []);
  const waterFC = useMemo(() => createMockWaterGeoJSON(), []);
  const forestFC = useMemo(() => createMockForestGeoJSON(), []);

  const claimsPolygonFC = useMemo(
    () =>
      turf.featureCollection(
        claims.map((c) => {
          const f = c.polygon!;
          f.properties = {
            id: c.id,
            status: c.status,
            claimant: c.claimant,
            areaHa: c.area,
            submittedDate: c.submittedDate,
            year: c.year,
            regionCode: c.regionCode,
            hasWater: c.assets.hasWater,
            hasForest: c.assets.hasForest,
            ponds: c.assets.ponds,
            wells: c.assets.wells,
            farmPlots: c.assets.farmPlots,
            forestPatches: c.assets.forestPatches,
            schemeScore: c.schemeScore ?? 0,
          };
          return f;
        })
      ),
    [claims]
  );
  const claimsPointsFC = useMemo(
    () =>
      turf.featureCollection(
        claims.map((c) =>
          turf.point(c.coordinates, {
            id: c.id,
            status: c.status,
            claimant: c.claimant,
            areaHa: c.area,
            submittedDate: c.submittedDate,
            year: c.year,
            regionCode: c.regionCode,
            hasWater: c.assets.hasWater,
            hasForest: c.assets.hasForest,
            ponds: c.assets.ponds,
            wells: c.assets.wells,
            farmPlots: c.assets.farmPlots,
            forestPatches: c.assets.forestPatches,
            schemeScore: c.schemeScore ?? 0,
          })
        )
      ),
    [claims]
  );
  const placesFC = useMemo(
    () =>
      turf.featureCollection(
        PLACE_LABELS.map((p) =>
          turf.point(p.coordinates, {
            id: p.id,
            name: p.name,
            type: p.type || "place",
            description: p.description || "",
          })
        )
      ),
    []
  );

  /* Filtering Expression */
  const applyFilters = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const filters: any[] = ["all"];

    const statusList = Array.from(enabledStatuses);
    if (statusList.length === 0) filters.push(["==", ["get", "status"], "__none__"]);
    else filters.push(["in", ["get", "status"], ["literal", statusList]]);

    if (selectedTimePeriod) {
      filters.push(["==", ["get", "year"], parseInt(selectedTimePeriod)]);
    }

    if (filterRegions.size > 0) {
      filters.push(["in", ["get", "regionCode"], ["literal", Array.from(filterRegions)]]);
    }
    if (filterRequiresWater) filters.push(["==", ["get", "hasWater"], true]);
    if (filterRequiresForest) filters.push(["==", ["get", "hasForest"], true]);

    [
      "claim-polygons-fill",
      "claim-polygons-outline",
      "claim-extrusions",
      "claim-points",
      "claim-labels",
      "claim-selected-outline",
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setFilter(layerId, filters as any);
    });
  }, [
    enabledStatuses,
    selectedTimePeriod,
    filterRegions,
    filterRequiresWater,
    filterRequiresForest,
  ]);

  /* Map init */
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 22.5937],
      zoom: 4.2,
      pitch: 45,
      bearing: 0,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" }));
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        } as AnySourceData);
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });
      }

      // Sources
      map.addSource("claim-polygons", {
        type: "geojson",
        data: claimsPolygonFC,
        promoteId: "id",
      });
      map.addSource("claim-points", {
        type: "geojson",
        data: claimsPointsFC,
        promoteId: "id",
      });
      map.addSource("places", { type: "geojson", data: placesFC, promoteId: "id" });
      map.addSource("water-assets", { type: "geojson", data: waterFC });
      map.addSource("forest-assets", { type: "geojson", data: forestFC });

      // NEW FEATURE: Draft claims source (empty initially)
      map.addSource("draft-claims", {
        type: "geojson",
        data: turf.featureCollection([]),
      });

      // Asset layers
      map.addLayer({
        id: "water-fill",
        type: "fill",
        source: "water-assets",
        layout: { visibility: showWaterLayer ? "visible" : "none" },
        paint: { "fill-color": "#3B82F6", "fill-opacity": waterOpacity / 100 },
      });
      map.addLayer({
        id: "water-outline",
        type: "line",
        source: "water-assets",
        layout: { visibility: showWaterLayer ? "visible" : "none" },
        paint: { "line-color": "#1D4ED8", "line-width": 2 },
      });
      map.addLayer({
        id: "forest-fill",
        type: "fill",
        source: "forest-assets",
        layout: { visibility: showForestLayer ? "visible" : "none" },
        paint: { "fill-color": "#16A34A", "fill-opacity": forestOpacity / 100 },
      });
      map.addLayer({
        id: "forest-outline",
        type: "line",
        source: "forest-assets",
        layout: { visibility: showForestLayer ? "visible" : "none" },
        paint: {
          "line-color": "#166534",
            "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      // Claim styling (fill)
      map.addLayer({
        id: "claim-polygons-fill",
        type: "fill",
        source: "claim-polygons",
        layout: { visibility: showClaimPolygons ? "visible" : "none" },
        paint: {
          "fill-color": usePriorityRamp ? priorityRampExpression : statusColorExpression,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            Math.min(1, polygonsOpacity / 100 + 0.25),
            [
              "case",
              ["all", ["boolean", focusSelectedOnly, false], ["!=", ["get", "id"], selectedClaim?.id || "___"]],
              0.15,
              polygonsOpacity / 100,
            ],
          ],
        },
      });
      // Outline
      map.addLayer({
        id: "claim-polygons-outline",
        type: "line",
        source: "claim-polygons",
        layout: { visibility: showClaimPolygons ? "visible" : "none" },
        paint: {
          "line-color": "#FFFFFF",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            2.4,
            1,
          ],
          "line-opacity": [
            "case",
            ["all", ["boolean", focusSelectedOnly, false], ["!=", ["get", "id"], selectedClaim?.id || "___"]],
            0.2,
            1,
          ],
        },
      });

      // Extrusions
      map.addLayer({
        id: "claim-extrusions",
        type: "fill-extrusion",
        source: "claim-polygons",
        layout: { visibility: showExtrusions ? "visible" : "none" },
        paint: {
          "fill-extrusion-color": usePriorityRamp
            ? priorityRampExpression
            : statusColorExpression,
          "fill-extrusion-opacity": 0.72,
          "fill-extrusion-height": ["*", ["get", "areaHa"], extrusionScale],
          "fill-extrusion-base": 0,
        },
      });

      // Points
      map.addLayer({
        id: "claim-points",
        type: "circle",
        source: "claim-points",
        layout: { visibility: showClaimPoints ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4, 4,
            8, 6,
            12, 10,
            16, 16,
          ],
          "circle-color": usePriorityRamp ? priorityRampExpression : statusColorExpression,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1,
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            Math.min(1, pointsOpacity / 100 + 0.25),
            [
              "case",
              ["all", ["boolean", focusSelectedOnly, false], ["!=", ["get", "id"], selectedClaim?.id || "___"]],
              0.2,
              pointsOpacity / 100,
            ],
          ],
        },
      });

      // Selected claim outline
      map.addLayer({
        id: "claim-selected-outline",
        type: "line",
        source: "claim-polygons",
        filter: ["==", "id", ""],
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "pulse"], false],
            "#FFFFFF",
            "#F5F5F5",
          ],
          "line-width": 5,
          "line-blur": 2,
          "line-opacity": 0.9,
        },
      });

      // Labels
      map.addLayer({
        id: "claim-labels",
        type: "symbol",
        source: "claim-points",
        layout: {
          visibility: showClaimLabels ? "visible" : "none",
          "text-field": [
            "concat",
            ["get", "id"],
            "\n",
            ["to-string", ["get", "areaHa"]],
            " ha",
          ],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#111",
          "text-halo-width": 1.2,
        },
      });

      // Draft claims layer (user drawn)
      map.addLayer({
        id: "draft-claims-fill",
        type: "fill",
        source: "draft-claims",
        paint: {
          "fill-color": "#8b5cf6",
          "fill-opacity": 0.35,
        },
      });
      map.addLayer({
        id: "draft-claims-outline",
        type: "line",
        source: "draft-claims",
        paint: {
          "line-color": "#7c3aed",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      // Places
      map.addLayer({
        id: "places-symbol",
        type: "symbol",
        source: "places",
        layout: {
          visibility: showPlaces ? "visible" : "none",
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 0.8],
          "text-anchor": "top",
          "icon-image": "marker-15",
          "icon-size": 1,
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 1,
        },
      });

      addEventHandlers(map);
      applyFilters();
      setMapLoaded(true);
    });

    return () => {
      if (pulseIntervalRef.current) window.clearInterval(pulseIntervalRef.current);
      map.remove();
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (mapLoaded) applyFilters();
  }, [mapLoaded, applyFilters]);

  // Resize after layout changes
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const t = setTimeout(() => m.resize(), 140);
    return () => clearTimeout(t);
  }, [
    selectedClaim,
    showClaimModal,
    layerPanelOpen,
    filterPanelOpen,
    settingsPanelOpen,
  ]);

  // Update dynamic layer styling visibilities & expressions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setVis = (id: string, vis: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis ? "visible" : "none");
    };
    setVis("claim-polygons-fill", showClaimPolygons);
    setVis("claim-polygons-outline", showClaimPolygons);
    setVis("claim-extrusions", showExtrusions);
    setVis("claim-points", showClaimPoints);
    setVis("claim-labels", showClaimLabels);
    setVis("places-symbol", showPlaces);
    setVis("water-fill", showWaterLayer);
    setVis("water-outline", showWaterLayer);
    setVis("forest-fill", showForestLayer);
    setVis("forest-outline", showForestLayer);

    if (map.getLayer("claim-polygons-fill"))
      map.setPaintProperty(
        "claim-polygons-fill",
        "fill-opacity",
        [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          Math.min(1, polygonsOpacity / 100 + 0.25),
          [
            "case",
            ["all", ["boolean", focusSelectedOnly, false], ["!=", ["get", "id"], selectedClaim?.id || "___"]],
            0.15,
            polygonsOpacity / 100,
          ],
        ]
      );

    if (map.getLayer("claim-points"))
      map.setPaintProperty(
        "claim-points",
        "circle-opacity",
        [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          Math.min(1, pointsOpacity / 100 + 0.25),
          [
            "case",
            ["all", ["boolean", focusSelectedOnly, false], ["!=", ["get", "id"], selectedClaim?.id || "___"]],
            0.2,
            pointsOpacity / 100,
          ],
        ]
      );

    if (map.getLayer("claim-extrusions"))
      map.setPaintProperty(
        "claim-extrusions",
        "fill-extrusion-height",
        ["*", ["get", "areaHa"], extrusionScale]
      );

    if (map.getLayer("water-fill"))
      map.setPaintProperty("water-fill", "fill-opacity", waterOpacity / 100);
    if (map.getLayer("forest-fill"))
      map.setPaintProperty("forest-fill", "fill-opacity", forestOpacity / 100);

    // Switch color ramp
    const fillColorExpr = usePriorityRamp ? priorityRampExpression : statusColorExpression;
    ["claim-polygons-fill", "claim-extrusions", "claim-points"].forEach((id) => {
      if (map.getLayer(id)) {
        const prop = id === "claim-extrusions" ? "fill-extrusion-color" : id === "claim-points" ? "circle-color" : "fill-color";
        map.setPaintProperty(id, prop as any, fillColorExpr);
      }
    });
  }, [
    showClaimPolygons,
    showExtrusions,
    showClaimPoints,
    showClaimLabels,
    showPlaces,
    polygonsOpacity,
    pointsOpacity,
    extrusionScale,
    showWaterLayer,
    waterOpacity,
    showForestLayer,
    forestOpacity,
    usePriorityRamp,
    focusSelectedOnly,
    selectedClaim,
  ]);

  const addEventHandlers = (map: Map) => {
    ["claim-polygons-fill", "claim-points"].forEach((layerId) => {
      map.on("mousemove", layerId, (e: MapLayerMouseEvent) => {
        if (!e.features?.length) return;
        const id = e.features[0].id as string;
        if (hoveredFeatureId && hoveredFeatureId !== id) {
          ["claim-polygons", "claim-points"].forEach((src) =>
            map.setFeatureState({ source: src, id: hoveredFeatureId }, { hover: false })
          );
        }
        map.setFeatureState(
          { source: layerId === "claim-points" ? "claim-points" : "claim-polygons", id },
          { hover: true }
        );
        setHoveredFeatureId(id);
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        if (hoveredFeatureId) {
          map.setFeatureState({ source: "claim-polygons", id: hoveredFeatureId }, { hover: false });
          map.setFeatureState({ source: "claim-points", id: hoveredFeatureId }, { hover: false });
        }
        setHoveredFeatureId(null);
        map.getCanvas().style.cursor = "";
      });
    });

    ["claim-polygons-fill", "claim-points"].forEach((layerId) => {
      map.on("click", layerId, (e: MapLayerMouseEvent) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as any;
        const claim = claims.find((c) => c.id === props.id);
        if (claim) {
          focusOnClaim(claim);
          setSelectedClaim(claim);
          updateSelectedHighlight(claim.id);
          startPulseAnimation(claim.id);
        }
      });
    });

    map.on("click", "places-symbol", (e: MapLayerMouseEvent) => {
      if (!e.features?.length) return;
      const f = e.features[0];
      const p = f.properties as any;
      const coords = (f.geometry as any).coordinates.slice();
      new mapboxgl.Popup({ offset: 12 })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-size:12px;">
            <strong>${p.name}</strong><br/>
            <em>${p.type || ""}</em><br/>
            ${p.description || ""}
          </div>`
        )
        .addTo(map);
    });

    // NEW FEATURE: listen for map click when route destination picking
    map.on("click", (e) => {
      if (routeActive && !routeDestination) {
        setRouteDestination([e.lngLat.lng, e.lngLat.lat]);
      }
    });
  };

  const updateSelectedHighlight = (id: string | null) => {
    const map = mapRef.current;
    if (!map || !map.getLayer("claim-selected-outline")) return;
    map.setFilter("claim-selected-outline", id ? ["==", "id", id] : ["==", "id", ""]);
  };

  const startPulseAnimation = (id: string) => {
    const map = mapRef.current;
    if (!map) return;
    if (pulseIntervalRef.current) {
      window.clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    pulseIntervalRef.current = window.setInterval(() => {
      pulseRef.current = !pulseRef.current;
      map.setFeatureState({ source: "claim-polygons", id }, { pulse: pulseRef.current });
    }, 650);
  };
  const stopPulse = () => {
    if (pulseIntervalRef.current) {
      window.clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    pulseRef.current = false;
    if (selectedClaim) {
      mapRef.current?.setFeatureState({ source: "claim-polygons", id: selectedClaim.id }, { pulse: false });
    }
  };

  const toggleStatus = (status: ClaimStatus) => {
    setEnabledStatuses((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const handleTimePeriodChange = (period: string) => setSelectedTimePeriod(period);

  const focusOnClaim = (claim: Claim) => {
    mapRef.current?.flyTo({
      center: claim.coordinates,
      zoom: 11.5,
      pitch: 55,
      bearing: 25,
      duration: 1400,
      essential: true,
    });
  };

  const handleSearchSelect = (value: { type: "place" | "claim"; id: string }) => {
    if (value.type === "claim") {
      const claim = claims.find((c) => c.id === value.id);
      if (claim) {
        focusOnClaim(claim);
        setSelectedClaim(claim);
        updateSelectedHighlight(claim.id);
        startPulseAnimation(claim.id);
      }
    } else {
      const place = PLACE_LABELS.find((p) => p.id === value.id);
      if (place) mapRef.current?.flyTo({ center: place.coordinates as LngLatLike, zoom: 9 });
    }
  };

  const filteredSearchResults = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return [];
    const placeMatches = PLACE_LABELS.filter((p) =>
      p.name.toLowerCase().includes(q)
    ).map((p) => ({ type: "place" as const, id: p.id, label: p.name }));
    const claimMatches = claims
      .filter(
        (c) => c.id.toLowerCase().includes(q) || c.claimant.toLowerCase().includes(q)
      )
      .map((c) => ({
        type: "claim" as const,
        id: c.id,
        label: `${c.id} (${c.claimant})`,
      }));
    return [...placeMatches, ...claimMatches].slice(0, 30);
  }, [placeSearch, claims]);

  const toggleRegion = (code: string) => {
    setFilterRegions((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const legendItems = useMemo(() => {
    const items: { color: string; label: string }[] = [];
    if (usePriorityRamp) {
      items.push({ color: "#0f766e", label: "Low Priority" });
      items.push({ color: "#16a34a", label: "Moderate" });
      items.push({ color: "#eab308", label: "Elevated" });
      items.push({ color: "#f97316", label: "High" });
      items.push({ color: "#dc2626", label: "Critical" });
    } else {
      STATUS_SEQUENCE.forEach((s) => {
        if (enabledStatuses.has(s))
          items.push({ color: STATUS_COLOR[s], label: s.replace("-", " ") });
      });
    }
    if (showWaterLayer) items.push({ color: "#3B82F6", label: "Water Bodies" });
    if (showForestLayer) items.push({ color: "#16A34A", label: "Forest Areas" });
    if (draftClaims.length > 0)
      items.push({ color: "#8b5cf6", label: "Draft (Drawn) Claim" });
    return items;
  }, [
    enabledStatuses,
    showWaterLayer,
    showForestLayer,
    draftClaims.length,
    usePriorityRamp,
  ]);

  const schemesForSelected = selectedClaim
    ? computeEligibleSchemes(selectedClaim)
    : [];

  const regionCodes = REGION_DEFINITIONS.map((r) => r.code);

  const closeClaimSelection = () => {
    updateSelectedHighlight(null);
    stopPulse();
    setSelectedClaim(null);
    setShowClaimModal(false);
  };

  /* -------------------- Drawing Integration -------------------- */
  const initDraw = async () => {
    if (drawRef.current || !mapRef.current) return;
    const MapboxDraw = (await import("@mapbox/mapbox-gl-draw")).default;
    const modes = MapboxDraw.modes;
    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      modes,
      defaultMode: "simple_select",
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: { "fill-color": "#8b5cf6", "fill-opacity": 0.2 },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: { "line-color": "#7c3aed", "line-width": 2 },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-halo-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: { "circle-radius": 6, "circle-color": "#ffffff" },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
            paint: { "circle-radius": 4, "circle-color": "#7c3aed" },
        },
      ],
    });
    mapRef.current.addControl(drawRef.current, "top-left");

    mapRef.current.on("draw.create", handleDrawUpdate);
    mapRef.current.on("draw.update", handleDrawUpdate);
    mapRef.current.on("draw.delete", handleDrawDelete);
  };

  const handleDrawUpdate = () => {
    if (!drawRef.current) return;
    const feats = drawRef.current.getAll();
    // Keep only newly drawn polygons as draft claims
    const newDrafts: DraftClaim[] = feats.features.map((f: any) => {
      const areaM2 = turf.area(f);
      const areaHa = areaM2 / 10000;
      const centroid = turf.centroid(f).geometry.coordinates as [number, number];
      return {
        id: f.id,
        feature: f as any,
        areaHa: +areaHa.toFixed(4),
        centroid,
        createdAt: new Date().toISOString(),
      };
    });
    setDraftClaims(newDrafts);
    updateDraftClaimsSource(newDrafts);
  };

  const handleDrawDelete = () => {
    if (!drawRef.current) return;
    const feats = drawRef.current.getAll();
    if (feats.features.length === 0) {
      setDraftClaims([]);
      updateDraftClaimsSource([]);
    } else {
      handleDrawUpdate();
    }
  };

  const updateDraftClaimsSource = (drafts: DraftClaim[]) => {
    const map = mapRef.current;
    if (!map) return;
    const fc = turf.featureCollection(
      drafts.map((d) => {
        const copy = { ...d.feature };
        copy.properties = {
          ...copy.properties,
          draftId: d.id,
          areaHa: d.areaHa,
        };
        return copy;
      })
    );
    const src: any = map.getSource("draft-claims");
    if (src) src.setData(fc);
  };

  const toggleDrawing = async () => {
    setDrawingEnabled((prev) => !prev);
    if (!drawingEnabled) {
      await initDraw();
    } else {
      if (drawRef.current && mapRef.current) {
        mapRef.current.removeControl(drawRef.current);
        drawRef.current = null;
        setDraftClaims([]);
        updateDraftClaimsSource([]);
      }
    }
  };

  const setDrawMode = (mode: "simple_select" | "draw_polygon" | "direct_select") => {
    setActiveDrawMode(mode);
    if (drawRef.current) drawRef.current.changeMode(mode);
  };

  const deleteAllDrafts = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    setDraftClaims([]);
    updateDraftClaimsSource([]);
  };

  const exportDraftGeoJSON = () => {
    const fc = turf.featureCollection(draftClaims.map((d) => d.feature));
    const txt = JSON.stringify(fc, null, 2);
    navigator.clipboard.writeText(txt);
    alert("Draft claims GeoJSON copied to clipboard.");
  };

  // Placeholder server save
  const saveDraftClaimToServer = async (draft: DraftClaim) => {
    console.log("Saving draft to server (stub)", draft);
    // TODO: Post to backend
  };

  /* -------------------- Geocoder Integration -------------------- */
  const initGeocoder = async () => {
    if (geocoderControlRef.current || !mapRef.current) return;
    const MapboxGeocoder = (await import("@mapbox/mapbox-gl-geocoder")).default;
    geocoderControlRef.current = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false,
      collapsed: true,
      placeholder: "Search (Mapbox)",
    });
    mapRef.current.addControl(geocoderControlRef.current, "top-left");
  };

  useEffect(() => {
    if (geocoderEnabled) {
      initGeocoder();
    } else if (geocoderControlRef.current && mapRef.current) {
      mapRef.current.removeControl(geocoderControlRef.current);
      geocoderControlRef.current = null;
    }
  }, [geocoderEnabled]);

  /* -------------------- Isochrone & Routing -------------------- */
  const fetchIsochrone = async () => {
    if (!mapRef.current) return;
    setFetchingIso(true);
    try {
      const center = mapRef.current.getCenter();
      const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${center.lng},${center.lat}?contours_minutes=${isochroneMinutes}&polygons=true&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      addOrUpdateIsochrone(data);
    } catch (e) {
      console.error("Isochrone error:", e);
    } finally {
      setFetchingIso(false);
    }
  };

  const addOrUpdateIsochrone = (geojson: any) => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource("isochrone")) {
      map.addSource("isochrone", { type: "geojson", data: geojson });
      map.addLayer({
        id: "isochrone-fill",
        type: "fill",
        source: "isochrone",
        paint: { "fill-color": "#0ea5e9", "fill-opacity": 0.25 },
      });
      map.addLayer({
        id: "isochrone-outline",
        type: "line",
        source: "isochrone",
        paint: { "line-color": "#0284c7", "line-width": 2 },
      });
    } else {
      (map.getSource("isochrone") as any).setData(geojson);
    }
  };

  const fetchRoute = async () => {
    if (!routeOrigin || !routeDestination) return;
    setFetchingRoute(true);
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${routeOrigin[0]},${routeOrigin[1]};${routeDestination[0]},${routeDestination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      const route = data.routes?.[0];
      if (route) {
        addOrUpdateRoute(route.geometry);
        setRouteInfo({
          distanceKm: +(route.distance / 1000).toFixed(2),
          durationMin: +(route.duration / 60).toFixed(1),
        });
      }
    } catch (e) {
      console.error("Route fetch error:", e);
    } finally {
      setFetchingRoute(false);
    }
  };

  const addOrUpdateRoute = (geometry: any) => {
    const map = mapRef.current;
    if (!map) return;
    const fc = turf.featureCollection([turf.lineString(geometry.coordinates)]);
    if (!map.getSource("route-line")) {
      map.addSource("route-line", { type: "geojson", data: fc });
      map.addLayer({
        id: "route-path",
        type: "line",
        source: "route-line",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
    } else {
      (map.getSource("route-line") as any).setData(fc);
    }
  };

  const pickRouteOrigin = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    setRouteOrigin([c.lng, c.lat]);
    setRouteDestination(null);
    setRouteInfo(null);
  };

  const schemesList = selectedClaim ? computeEligibleSchemes(selectedClaim) : [];

  const exportSelectedClaim = () => {
    if (!selectedClaim) return;
    const fc = turf.featureCollection([selectedClaim.polygon!]);
    navigator.clipboard.writeText(JSON.stringify(fc, null, 2));
    alert("Selected claim GeoJSON copied.");
  };

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* LEFT PANEL */}
      <div
        className={`${
          layerPanelOpen ? "w-84 max-w-[21rem]" : "w-12"
        } bg-card border-r transition-all duration-300 z-20 shrink-0`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${layerPanelOpen ? "block" : "hidden"}`}>
              FRA Layers
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLayerPanelOpen(!layerPanelOpen)}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
          {layerPanelOpen && (
            <div className="space-y-6 pb-10">
              {eli5Mode && (
                <Alert className="eli5-mode">
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Interactive FRA Atlas: draw new claims, analyze priority,
                    water/forest assets & travel reach.
                  </AlertDescription>
                </Alert>
              )}

              {/* TIME */}
              <section className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Time Period
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {["2023", "2024"].map((yr) => (
                    <Button
                      key={yr}
                      variant={selectedTimePeriod === yr ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimePeriodChange(yr)}
                    >
                      {yr}
                    </Button>
                  ))}
                </div>
              </section>

              {/* CLAIM LAYERS */}
              <section className="space-y-4">
                <LayerToggleRow
                  label="Polygons"
                  checked={showClaimPolygons}
                  onChange={setShowClaimPolygons}
                />
                <OpacitySlider
                  label="Polygon Opacity"
                  value={polygonsOpacity}
                  onChange={setPolygonsOpacity}
                />
                <LayerToggleRow
                  label="Points"
                  checked={showClaimPoints}
                  onChange={setShowClaimPoints}
                />
                <OpacitySlider
                  label="Point Opacity"
                  value={pointsOpacity}
                  onChange={setPointsOpacity}
                />
                <LayerToggleRow
                  label="3D Extrusions"
                  icon={<Box className="h-3 w-3" />}
                  checked={showExtrusions}
                  onChange={setShowExtrusions}
                />
                {showExtrusions && (
                  <OpacitySlider
                    label={`Height Scale (x ${extrusionScale})`}
                    value={extrusionScale}
                    max={200}
                    step={10}
                    onChange={setExtrusionScale}
                  />
                )}
                <LayerToggleRow
                  label="Claim Labels"
                  checked={showClaimLabels}
                  onChange={setShowClaimLabels}
                />
                <LayerToggleRow
                  label="Places"
                  icon={<Globe2 className="h-3 w-3" />}
                  checked={showPlaces}
                  onChange={setShowPlaces}
                />
                <LayerToggleRow
                  label="Focus Selected Only"
                  icon={<Target className="h-3 w-3" />}
                  checked={focusSelectedOnly}
                  onChange={setFocusSelectedOnly}
                />
                <LayerToggleRow
                  label="Priority Ramp"
                  icon={<ShieldCheck className="h-3 w-3" />}
                  checked={usePriorityRamp}
                  onChange={setUsePriorityRamp}
                />
              </section>

              {/* ASSET LAYERS */}
              <section className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Asset Layers
                </Label>
                <LayerToggleRow
                  label="Water Bodies"
                  icon={<Droplets className="h-3 w-3" />}
                  checked={showWaterLayer}
                  onChange={setShowWaterLayer}
                />
                {showWaterLayer && (
                  <OpacitySlider
                    label={`Water Opacity (${waterOpacity}%)`}
                    value={waterOpacity}
                    onChange={setWaterOpacity}
                  />
                )}
                <LayerToggleRow
                  label="Forest Areas"
                  icon={<Leaf className="h-3 w-3" />}
                  checked={showForestLayer}
                  onChange={setShowForestLayer}
                />
                {showForestLayer && (
                  <OpacitySlider
                    label={`Forest Opacity (${forestOpacity}%)`}
                    value={forestOpacity}
                    onChange={setForestOpacity}
                  />
                )}
              </section>

              {/* STATUS FILTERS */}
              <section className="space-y-2">
                <Label className="text-sm font-medium">Claim Status</Label>
                <div className="space-y-1 text-xs">
                  {STATUS_SEQUENCE.map((st) => (
                    <label
                      key={st}
                      className="flex items-center justify-between capitalize"
                    >
                      <span>{st.replace("-", " ")}</span>
                      <Switch
                        checked={enabledStatuses.has(st)}
                        onCheckedChange={() => toggleStatus(st)}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnabledStatuses(new Set(STATUS_SEQUENCE))}
                    className="w-1/2"
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnabledStatuses(new Set())}
                    className="w-1/2"
                  >
                    None
                  </Button>
                </div>
              </section>

              {/* REGION FILTER */}
              <section className="space-y-2">
                <Label className="text-sm font-medium">Regions</Label>
                <div className="flex flex-wrap gap-1">
                  {regionCodes.map((rc) => {
                    const active = filterRegions.has(rc);
                    return (
                      <button
                        key={rc}
                        type="button"
                        onClick={() => toggleRegion(rc)}
                        className={`px-2 py-0.5 rounded text-xs border transition ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-background"
                        }`}
                      >
                        {rc}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-1/2 mt-1"
                    onClick={() => setFilterRegions(new Set(regionCodes))}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-1/2 mt-1"
                    onClick={() => setFilterRegions(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </section>

              {/* ASSET PRESENCE */}
              <section className="space-y-2">
                <Label className="text-sm font-medium">Asset Presence</Label>
                <label className="flex items-center justify-between text-xs">
                  <span>Requires Water</span>
                  <Switch
                    checked={filterRequiresWater}
                    onCheckedChange={(c) => setFilterRequiresWater(!!c)}
                  />
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span>Requires Forest</span>
                  <Switch
                    checked={filterRequiresForest}
                    onCheckedChange={(c) => setFilterRequiresForest(!!c)}
                  />
                </label>
              </section>

              {/* DRAWING */}
              <section className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PenTool className="h-4 w-4" /> Digitize Claims
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={drawingEnabled ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={toggleDrawing}
                  >
                    {drawingEnabled ? "Disable" : "Enable"} Draw
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!drawingEnabled}
                    onClick={() => setDrawMode("draw_polygon")}
                    title="Draw Polygon"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!drawingEnabled}
                    onClick={() => setDrawMode("direct_select")}
                    title="Edit Vertices"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>
                {drawingEnabled && (
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={draftClaims.length === 0}
                        onClick={deleteAllDrafts}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={draftClaims.length === 0}
                        onClick={exportDraftGeoJSON}
                      >
                        Export
                      </Button>
                    </div>
                    {draftClaims.length > 0 && (
                      <div className="border rounded p-2 max-h-40 overflow-auto bg-background/60">
                        {draftClaims.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between py-1 border-b last:border-b-0"
                          >
                            <span className="truncate">
                              {d.id.slice(0, 6)}… {d.areaHa.toFixed(2)} ha
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveDraftClaimToServer(d)}
                            >
                              Save
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* LEGEND */}
              <section className="space-y-2">
                <Label className="text-sm font-medium">Legend</Label>
                <div className="space-y-1 text-xs">
                  {legendItems.map((li) => (
                    <LegendDot key={li.label} color={li.color} label={li.label} />
                  ))}
                </div>
              </section>

              <section className="space-y-1">
                <Label className="text-sm font-medium">Upcoming</Label>
                <p className="text-xs text-muted-foreground">
                  Vector tiles (full India), OCR ingestion, ML asset overlays, DSS
                  multi-scheme optimization, offline field app.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* MAP & SEARCH */}
      <div className="flex-1 relative min-w-0">
        {/* Internal Search */}
        <div className="absolute top-4 left-4 z-20 w-80 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={placeSearch}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => setPlaceSearch(e.target.value)}
                placeholder="Search claim ID / claimant / place..."
                className="w-full pl-8 pr-2 rounded-md border bg-background/80 backdrop-blur px-3 py-2 text-xs focus:outline-none focus:ring"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen((o) => !o)}
              className="shrink-0"
            >
              {searchOpen ? "Hide" : "Show"}
            </Button>
          </div>
          {searchOpen && placeSearch && (
            <div className="max-h-72 overflow-auto rounded-md border bg-card/95 backdrop-blur shadow text-xs">
              {filteredSearchResults.length ? (
                filteredSearchResults.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSearchSelect({ type: r.type, id: r.id })}
                    className="w-full text-left px-3 py-2 hover:bg-accent/70 border-b last:border-b-0"
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="block text-muted-foreground">
                      {r.type === "claim" ? "Claim" : "Place"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-muted-foreground">No matches</div>
              )}
            </div>
          )}
        </div>

        <div ref={mapContainerRef} className="w-full h-full" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <MapPin className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Loading FRA Atlas
                </h3>
                <p className="text-muted-foreground mb-4">
                  Initializing WebGL map, 3D terrain & claims…
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right-side floating controls */}
        <div className="absolute top-4 right-4 space-y-2 z-30">
          <Button
            variant="outline"
            size="icon"
            aria-label="Map Settings"
            onClick={() => setSettingsPanelOpen((o) => !o)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filters"
            onClick={() => setFilterPanelOpen((o) => !o)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* SETTINGS PANEL */}
        {settingsPanelOpen && (
          <FloatingPanel title="Map Settings" onClose={() => setSettingsPanelOpen(false)}>
            <div className="space-y-3 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  mapRef.current?.flyTo({
                    center: [78.9629, 22.5937],
                    zoom: 4.2,
                    pitch: 45,
                    bearing: 0,
                  });
                }}
              >
                Reset View
              </Button>
              <label className="flex items-center justify-between">
                <span>Enable Geocoder</span>
                <Switch
                  checked={geocoderEnabled}
                  onCheckedChange={(c) => setGeocoderEnabled(!!c)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Isochrone Mode</span>
                <Switch
                  checked={isochroneActive}
                  onCheckedChange={(c) => setIsochroneActive(!!c)}
                />
              </label>
              {isochroneActive && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Minutes: {isochroneMinutes}</Label>
                  <Slider
                    value={[isochroneMinutes]}
                    max={180}
                    step={15}
                    onValueChange={(v) => setIsochroneMinutes(v[0])}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1"
                    disabled={fetchingIso}
                    onClick={fetchIsochrone}
                  >
                    {fetchingIso ? "Generating..." : "Generate Isochrone"}
                  </Button>
                </div>
              )}
              <label className="flex items-center justify-between">
                <span>Route Mode</span>
                <Switch
                  checked={routeActive}
                  onCheckedChange={(c) => {
                    setRouteActive(!!c);
                    if (!c) {
                      setRouteOrigin(null);
                      setRouteDestination(null);
                      setRouteInfo(null);
                    }
                  }}
                />
              </label>
              {routeActive && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={pickRouteOrigin}
                    >
                      Pick Center As Origin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!routeOrigin || !routeDestination || fetchingRoute}
                      onClick={fetchRoute}
                    >
                      {fetchingRoute ? "Routing..." : "Compute Route"}
                    </Button>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div>Origin: {routeOrigin ? routeOrigin.map(n=>n.toFixed(3)).join(",") : "-"}</div>
                    <div>
                      Dest:{" "}
                      {routeDestination
                        ? routeDestination.map(n=>n.toFixed(3)).join(",")
                        : "- (click map)"}
                    </div>
                    {routeInfo && (
                      <div className="mt-1">
                        Dist: {routeInfo.distanceKm} km / {routeInfo.durationMin} min
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FloatingPanel>
        )}

        {/* QUICK FILTER PANEL */}
        {filterPanelOpen && (
          <FloatingPanel
            title="Quick Filters"
            className="top-24 right-4 w-64"
            onClose={() => setFilterPanelOpen(false)}
          >
            <div className="space-y-4 text-xs">
              <div>
                <div className="font-medium mb-1">Statuses</div>
                {STATUS_SEQUENCE.map((st) => (
                  <label
                    key={st}
                    className="flex items-center justify-between capitalize mb-1"
                  >
                    <span>{st.replace("-", " ")}</span>
                    <Switch
                      checked={enabledStatuses.has(st)}
                      onCheckedChange={() => toggleStatus(st)}
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-1/2"
                  onClick={() => setEnabledStatuses(new Set(STATUS_SEQUENCE))}
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-1/2"
                  onClick={() => setEnabledStatuses(new Set())}
                >
                  None
                </Button>
              </div>
              <div className="pt-2 border-t">
                <div className="font-medium mb-1">Assets</div>
                <label className="flex items-center justify-between mb-1">
                  <span>Has Water</span>
                  <Switch
                    checked={filterRequiresWater}
                    onCheckedChange={(c) => setFilterRequiresWater(!!c)}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Has Forest</span>
                  <Switch
                    checked={filterRequiresForest}
                    onCheckedChange={(c) => setFilterRequiresForest(!!c)}
                  />
                </label>
              </div>
            </div>
          </FloatingPanel>
        )}

        {/* INTERNAL SEARCH RESULTS already above map */}

      </div>

      {/* RIGHT SIDEBAR */}
      {selectedClaim && (
        <div className="w-80 bg-card border-l p-4 overflow-y-auto shrink-0 z-30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Claim Details</h3>
            <Button variant="ghost" size="icon" onClick={closeClaimSelection}>
              ×
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                {selectedClaim.id}
                <Badge variant={getStatusBadgeVariant(selectedClaim.status)}>
                  {selectedClaim.status.replace("-", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <InfoField label="Claimant" value={selectedClaim.claimant} />
              <InfoField
                label="Area"
                value={`${selectedClaim.area.toFixed(2)} ha`}
              />
              <InfoField
                label="Submitted"
                value={new Date(selectedClaim.submittedDate).toLocaleDateString()}
              />
              <InfoField label="Region" value={selectedClaim.regionCode} />
              <InfoField
                label="Scheme Score"
                value={String(selectedClaim.schemeScore)}
              />
              <InfoField
                label="Assets"
                value={`P:${selectedClaim.assets.ponds} W:${selectedClaim.assets.wells} Fm:${selectedClaim.assets.farmPlots} Fr:${selectedClaim.assets.forestPatches}`}
              />
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => focusOnClaim(selectedClaim)}
                >
                  Focus on Map
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowClaimModal(true)}
                >
                  Open Detailed Modal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={exportSelectedClaim}
                >
                  Copy GeoJSON
                </Button>
              </div>
              <div className="pt-2 text-[11px] text-muted-foreground">
                Schemes: {schemesList.map((s) => s.code).join(", ") || "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CLAIM MODAL */}
      {showClaimModal && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="bg-card w-[780px] max-w-[94vw] max-h-[88vh] rounded-lg border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="text-sm font-semibold">
                Claim Overview: {selectedClaim.id}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClaimModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
              <section className="grid grid-cols-2 gap-4">
                <StatCard label="Claimant" value={selectedClaim.claimant} />
                <StatCard
                  label="Status"
                  value={selectedClaim.status.replace("-", " ")}
                  badgeColor={STATUS_COLOR[selectedClaim.status]}
                />
                <StatCard
                  label="Area"
                  value={`${selectedClaim.area.toFixed(2)} ha`}
                />
                <StatCard
                  label="Submitted"
                  value={new Date(selectedClaim.submittedDate).toLocaleDateString()}
                />
                <StatCard label="Region" value={selectedClaim.regionCode} />
                <StatCard
                  label="Scheme Score"
                  value={selectedClaim.schemeScore ?? 0}
                />
              </section>

              <section>
                <h4 className="font-medium mb-2 text-xs uppercase tracking-wide">
                  DSS Scheme Eligibility
                </h4>
                <div className="space-y-2">
                  {schemesList.length ? (
                    schemesList.map((sch) => (
                      <div
                        key={sch.code}
                        className="p-2 rounded-md border text-xs flex flex-col gap-1"
                      >
                        <div className="font-semibold">{sch.name}</div>
                        <div className="text-muted-foreground">{sch.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No schemes identified.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2 text-xs uppercase tracking-wide">
                  AI / Asset Interpretation
                </h4>
                <ul className="text-xs list-disc ml-5 space-y-1">
                  <li>
                    Water sources: {selectedClaim.assets.ponds + selectedClaim.assets.wells}
                  </li>
                  <li>Farm plots: {selectedClaim.assets.farmPlots}</li>
                  <li>Forest patches: {selectedClaim.assets.forestPatches}</li>
                </ul>
              </section>

              <section>
                <h4 className="font-medium mb-2 text-xs uppercase tracking-wide">
                  Recommended Actions
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <ActionChip label="Verify Docs" />
                  <ActionChip label="Boundary Check" />
                  <ActionChip label="Assign Surveyor" />
                  <ActionChip label="Asset Survey" />
                  <ActionChip label="DSS Review" />
                  <ActionChip label="Generate Passbook" />
                </div>
              </section>
            </div>
            <div className="p-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => focusOnClaim(selectedClaim)}
              >
                Center On Claim
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClaimModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   UI HELPERS
------------------------------------------------------------- */
const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <Label className="text-[11px] text-muted-foreground">{label}</Label>
    <div className="text-xs">{value}</div>
  </div>
);
const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);
const LayerToggleRow = ({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <Label className="text-sm flex items-center gap-1">
      {icon}
      {label}
    </Label>
    <Switch checked={checked} onCheckedChange={(c) => onChange(!!c)} />
  </div>
);
const OpacitySlider = ({
  label,
  value,
  onChange,
  max = 100,
  step = 5,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  step?: number;
}) => (
  <div className="ml-1">
    <Label className="text-[11px] text-muted-foreground">
      {label}: {value}
      {max === 100 ? "%" : ""}
    </Label>
    <Slider
      value={[value]}
      max={max}
      step={step}
      className="mt-1"
      onValueChange={(v) => onChange(v[0])}
    />
  </div>
);
const FloatingPanel = ({
  title,
  children,
  onClose,
  className = "top-4 right-20 w-64",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) => (
  <div
    className={`absolute ${className} bg-card border rounded shadow p-3 space-y-3 text-sm z-30`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="font-medium">{title}</span>
      <Button variant="ghost" size="sm" onClick={onClose}>
        ×
      </Button>
    </div>
    {children}
  </div>
);
const StatCard = ({
  label,
  value,
  badgeColor,
}: {
  label: string;
  value: string | number;
  badgeColor?: string;
}) => (
  <div className="border rounded p-2 flex flex-col gap-1 bg-background/60 backdrop-blur">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="text-xs font-medium flex items-center gap-1">
      {badgeColor && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: badgeColor }}
        />
      )}
      {value}
    </div>
  </div>
);
const ActionChip = ({ label }: { label: string }) => (
  <div className="px-2 py-1 rounded border bg-background/60 text-center">
    {label}
  </div>
);

export default Atlas;