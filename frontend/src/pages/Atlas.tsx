import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, { AnySourceData, Map, MapLayerMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Search, X, MousePointerClick, Square, Save, Send, CheckCircle, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AtlasApi } from "@/lib/atlas-api";
import { FRDApi } from "@/lib/frd-api";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_TOKEN =
  "pk.eyJ1IjoidmVua2F0YS1rcmlzaG5hIiwiYSI6ImNtZnYycHN0bTAzY28yanFxeG4wOXVsenAifQ.w1yd6XuvWvarYj33rP1LkA";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || DEFAULT_TOKEN;

// Adjust if your header height differs; ensures no extra whitespace
const HEADER_H_PX = 64;

// Polygons fade in around this zoom
const POLY_MIN_ZOOM = 10.5;

type ClaimStatusKey =
  | "approved"
  | "rejected"
  | "draft"
  | "fraud"
  | "submitted"
  | "under-verification";

const STATUS_COLOR: Record<string, string> = {
  approved: "#16A34A",
  rejected: "#DC2626",
  draft: "#6B7280",
  fraud: "#8B1E66",
  submitted: "#9CA3AF",
  "under-verification": "#2563EB",
};

const statusColorExpr: any = [
  "match",
  ["coalesce", ["get", "status"], ""],
  "approved",
  STATUS_COLOR.approved,
  "rejected",
  STATUS_COLOR.rejected,
  "draft",
  STATUS_COLOR.draft,
  "fraud",
  STATUS_COLOR.fraud,
  "submitted",
  STATUS_COLOR.submitted,
  "under_verification",
  STATUS_COLOR["under-verification"],
  "#6B7280",
];

// Smooth fade-in for polygons near POLY_MIN_ZOOM
const polyFillOpacityExpr: any = [
  "interpolate",
  ["linear"],
  ["zoom"],
  POLY_MIN_ZOOM - 1,
  0,
  POLY_MIN_ZOOM,
  0.18,
  POLY_MIN_ZOOM + 1.5,
  0.38,
];

export default function Atlas() {
  const mapRef = useRef<Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<any | null>(null);

  const { token, user } = useAuthStore();
  const role = user?.role;
  const isFRD = role === "forest_revenue_officer" || role === "mota_admin";

  const [fc, setFc] = useState<any>({ type: "FeatureCollection", features: [] });
  const [loaded, setLoaded] = useState(false);

  // Layers panel open/close
  const [layersOpen, setLayersOpen] = useState(true);

  // Filters (live under Layers only)
  const [enabled, setEnabled] = useState<Record<ClaimStatusKey, boolean>>({
    approved: true,
    rejected: true,
    draft: true,
    fraud: true,
    submitted: true,
    "under-verification": true,
  });

  // State-wise filtering
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set()); // empty => all

  // Toggle points visibility
  const [showPoints, setShowPoints] = useState(true);

  // Search
  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);

  // Selection for right-side detail
  const [selected, setSelected] = useState<any | null>(null);

  // FRD draft state
  const [draftGeom, setDraftGeom] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }, []);

  // Load claims from backend
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await AtlasApi.getClaimsFC(token);
        setFc(data || { type: "FeatureCollection", features: [] });
        // Build available states from feature properties
        const states = new Set<string>();
        (data?.features || []).forEach((f: any) => {
          const p = f.properties || {};
          const v =
            p.state ||
            p.state_name ||
            p.state_code ||
            (p.state_id != null ? String(p.state_id) : null);
          if (v && String(v).trim()) states.add(String(v));
        });
        setAvailableStates(Array.from(states).sort());
      } catch (e) {
        console.error("Atlas feed error:", e);
        setFc({ type: "FeatureCollection", features: [] });
        setAvailableStates([]);
      }
    })();
  }, [token]);

  // Initialize map
  useEffect(() => {
    if (!mapElRef.current) return;

    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 22.5937],
      zoom: 4.2,
      pitch: 45,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" }));
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    map.on("load", () => {
      // Terrain
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        } as AnySourceData);
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });
      }

      const polysFC = computePolygonsFC(fc);
      const pointsFC = computePointsFC(fc);

      map.addSource("claim-polygons", { type: "geojson", data: polysFC, promoteId: "id" });
      map.addSource("claim-points", { type: "geojson", data: pointsFC, promoteId: "id" });

      // POINTS
      map.addLayer({
        id: "claim-points",
        type: "circle",
        source: "claim-points",
        layout: { visibility: showPoints ? "visible" : "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 10, 16, 14],
          "circle-color": statusColorExpr,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.92,
        },
      });

      // LABELS
      map.addLayer({
        id: "claim-point-labels",
        type: "symbol",
        source: "claim-points",
        layout: {
          visibility: showPoints ? "visible" : "none",
          "text-field": [
            "coalesce",
            ["get", "claim_identifier"],
            ["concat", "#", ["to-string", ["get", "id"]]],
          ],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9, 12, 13, 14, 14],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-overlap": "cooperative",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#111",
          "text-halo-width": 1.2,
        },
      });

      // POLYGONS (fade-in with zoom)
      map.addLayer({
        id: "claim-polygons-fill",
        type: "fill",
        source: "claim-polygons",
        paint: {
          "fill-color": statusColorExpr,
          "fill-opacity": polyFillOpacityExpr,
        },
      });
      map.addLayer({
        id: "claim-polygons-outline",
        type: "line",
        source: "claim-polygons",
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], POLY_MIN_ZOOM - 1, 0, POLY_MIN_ZOOM, 1.2, POLY_MIN_ZOOM + 2, 2],
          "line-opacity": polyFillOpacityExpr,
        },
      });

      // Selected polygon outline
      map.addLayer({
        id: "selected-polygon-outline",
        type: "line",
        source: "claim-polygons",
        filter: ["==", "id", ""],
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-blur": 1.5,
        },
      });

      // Click handlers
      ["claim-points", "claim-polygons-fill"].forEach((layerId) => {
        map.on("click", layerId, (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f) return;
          const props = f.properties as any;
          const id = props?.id ?? props?.["id"];

          setSelected({
            id,
            props,
            hasPolygon: f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
          });

          flyToFeature(map, f);
          updateSelectedFilter(map, id);
        });
      });

      // Cursor
      ["claim-points", "claim-polygons-fill"].forEach((layerId) => {
        map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));
      });

      setLoaded(true);
      applyFilters(map, enabled, selectedStates);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
    };
  }, []); // init once

  // Update sources when data changes
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;
    const polysFC = computePolygonsFC(fc);
    const pointsFC = computePointsFC(fc);
    const s1: any = map.getSource("claim-polygons");
    const s2: any = map.getSource("claim-points");
    if (s1) s1.setData(polysFC);
    if (s2) s2.setData(pointsFC);
    if (selected?.id != null) updateSelectedFilter(map, selected.id);
  }, [fc, loaded, selected?.id]);

  // Apply filters when toggles change
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    applyFilters(mapRef.current, enabled, selectedStates);
  }, [enabled, selectedStates, loaded]);

  // Show/hide points
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const vis = showPoints ? "visible" : "none";
    if (map.getLayer("claim-points")) map.setLayoutProperty("claim-points", "visibility", vis);
    if (map.getLayer("claim-point-labels")) map.setLayoutProperty("claim-point-labels", "visibility", vis);
  }, [showPoints, loaded]);

  // Auto-focus claim if URL param exists
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("claimId");
    if (!cid) return;
    const idNum = Number(cid);
    const feat = (fc.features || []).find((f: any) => Number(f.properties?.id ?? f.id) === idNum);
    if (feat) {
      setSelected({ id: idNum, props: feat.properties, hasPolygon: ["Polygon", "MultiPolygon"].includes(feat.geometry?.type) });
      flyToFeature(map, feat);
      updateSelectedFilter(map, idNum);
    }
  }, [loaded, fc]);

  // Re-resize map when panels open/close (ensures tiles refresh)
  useEffect(() => {
    mapRef.current?.resize();
  }, [layersOpen, selected?.id]);

  // Search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const feats = (fc.features || []) as any[];
    return feats
      .map((f) => {
        const id = f.properties?.id ?? f.id;
        const cid = f.properties?.claim_identifier ?? "";
        let center: [number, number] | null = null;
        try {
          center = turf.center(f).geometry.coordinates as [number, number];
        } catch {
          if (f.geometry?.type === "Point") center = f.geometry.coordinates as [number, number];
        }
        return { id, label: cid || `#${id}`, center };
      })
      .filter((r) => r.center && (String(r.label).toLowerCase().includes(q) || String(r.id).includes(q)))
      .slice(0, 40);
  }, [query, fc]);

  const toggleStatus = (key: ClaimStatusKey) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const setAllStatuses = (val: boolean) =>
    setEnabled({
      approved: val,
      rejected: val,
      draft: val,
      fraud: val,
      submitted: val,
      "under-verification": val,
    });

  const toggleState = (s: string) =>
    setSelectedStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const setAllStates = (checkAll: boolean) => {
    setSelectedStates(checkAll ? new Set(availableStates) : new Set());
  };

  const closeDetails = () => {
    if (mapRef.current) updateSelectedFilter(mapRef.current, null);
    setSelected(null);
  };

  // FRD Draw helpers
  async function ensureDraw() {
    if (drawRef.current || !mapRef.current || !isFRD) return;
    const DrawMod: any = await import("@mapbox/mapbox-gl-draw");
    const MapboxDraw = DrawMod?.default || DrawMod;
    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: "simple_select",
      styles: [
        { id: "gl-draw-polygon-fill", type: "fill", filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]], paint: { "fill-color": "#8b5cf6", "fill-opacity": 0.2 } },
        { id: "gl-draw-polygon-stroke-active", type: "line", filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]], paint: { "line-color": "#7c3aed", "line-width": 2 } },
        { id: "gl-draw-polygon-and-line-vertex-halo-active", type: "circle", filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]], paint: { "circle-radius": 6, "circle-color": "#ffffff" } },
        { id: "gl-draw-polygon-and-line-vertex-active", type: "circle", filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]], paint: { "circle-radius": 4, "circle-color": "#7c3aed" } }
      ]
    });
    mapRef.current.addControl(drawRef.current, "top-left");
    mapRef.current.on("draw.create", onDrawChange);
    mapRef.current.on("draw.update", onDrawChange);
    mapRef.current.on("draw.delete", onDrawChange);
  }
  function setDrawMode(mode: "simple_select" | "draw_polygon" | "direct_select") {
    drawRef.current?.changeMode?.(mode);
  }
  function clearDraft() {
    drawRef.current?.deleteAll?.();
    setDraftGeom(null);
  }
  const onDrawChange = () => {
    const fc = drawRef.current?.getAll?.();
    if (!fc) return;
    const polys = fc.features.filter((f: any) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon");
    setDraftGeom({ type: "FeatureCollection", features: polys });
  };
  async function saveGeometry(action: "save" | "submit" | "verify") {
    if (!isFRD || !token) return;
    if (!selected?.id) {
      alert("Select a claim on the map first.");
      return;
    }
    if (!draftGeom || !draftGeom.features?.length) {
      alert("Draw a polygon for the selected claim.");
      return;
    }
    setSaving(true);
    try {
      let geometry: any = draftGeom.features[0].geometry;
      if (draftGeom.features.length > 1) {
        geometry = { type: "MultiPolygon", coordinates: draftGeom.features.map((f: any) => f.geometry.coordinates) };
      }
      await FRDApi.updateGeometry(token, Number(selected.id), geometry, {
        submit: action === "submit",
        verify: action === "verify",
        note: action === "save" ? "Draft geometry updated" : action === "submit" ? "Geometry submitted for review" : "Verified"
      });
      alert(`Geometry ${action}d successfully.`);
      // Refresh dataset
      const data = await AtlasApi.getClaimsFC(token);
      setFc(data || { type: "FeatureCollection", features: [] });
      clearDraft();
      setDrawMode("simple_select");
    } catch (e: any) {
      alert(e?.message || "Failed to update geometry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="relative w-full p-0 m-0"
      style={{ height: `calc(100vh - ${HEADER_H_PX}px)` }}
    >
      {/* Floating top-left controls: Layers + Search */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 w-[min(92vw,620px)]">
        {/* Row: Layers + Search */}
        <div className="flex gap-2">
          <Button
            size="icon"
            variant={layersOpen ? "default" : "outline"}
            onClick={() => setLayersOpen((v) => !v)}
            title="Layers"
            aria-label="Layers"
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResultsOpen(true);
              }}
              onFocus={() => setResultsOpen(true)}
              placeholder="Search claim identifier or #id"
              className="pl-9 bg-background/90 backdrop-blur"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setResultsOpen((o) => !o)}>
            {resultsOpen ? "Hide" : "Show"}
          </Button>
        </div>

        {/* Search results dropdown */}
        {resultsOpen && query && (
          <div className="max-h-72 overflow-auto rounded-md border bg-card/95 backdrop-blur shadow text-xs">
            {results.length ? (
              results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-2 hover:bg-accent/70 border-b last:border-b-0"
                  onClick={() => {
                    if (r.center && mapRef.current) {
                      mapRef.current.flyTo({ center: r.center, zoom: Math.max(POLY_MIN_ZOOM, 12) });
                      const props = findPropsById(fc, r.id);
                      setSelected({ id: r.id, props, hasPolygon: hasPolygonById(fc, r.id) });
                      updateSelectedFilter(mapRef.current, r.id);
                      setResultsOpen(false);
                    }
                  }}
                >
                  <span className="font-medium">{r.label}</span>
                  <span className="block text-muted-foreground">Claim</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-muted-foreground">No matches</div>
            )}
          </div>
        )}

        {/* Layers panel (overlay, includes status, state and point toggle, FRD draw) */}
        {layersOpen && (
          <div className="rounded-md border bg-white backdrop-blur p-3 shadow-black">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Layers & Filters</Label>
              <Button size="icon" variant="ghost" onClick={() => setLayersOpen(false)} aria-label="Close layers">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Show Points toggle */}
            <div className="flex items-center justify-between border rounded px-2 py-1 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Show Points
              </span>
              <Switch checked={showPoints} onCheckedChange={(c) => setShowPoints(!!c)} />
            </div>

            {/* Status filter */}
            <div className="mb-2">
              <Label className="text-xs">Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-1">
                {([
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                  ["draft", "Draft"],
                  ["fraud", "Fraud"],
                  ["submitted", "Submitted"],
                  ["under-verification", "Under Verification"],
                ] as [ClaimStatusKey, string][]).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[k] || "#6B7280" }}
                      />
                      {label}
                    </span>
                    <Switch checked={enabled[k]} onCheckedChange={() => toggleStatus(k)} />
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setAllStatuses(true)}>
                  All
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setAllStatuses(false)}>
                  None
                </Button>
              </div>
            </div>

            {/* State-wise filter */}
            <div className="mt-2">
              <Label className="text-xs">State</Label>
              <div className="max-h-40 overflow-auto mt-1 border rounded">
                {availableStates.length ? (
                  availableStates.map((s) => {
                    const checked = selectedStates.has(s) || selectedStates.size === 0; // empty => All
                    return (
                      <label
                        key={s}
                        className="flex items-center justify-between px-2 py-1 text-xs hover:bg-accent/50"
                      >
                        <span>{s}</span>
                        <Switch
                          checked={selectedStates.size === 0 ? true : selectedStates.has(s)}
                          onCheckedChange={() => {
                            // If all are considered selected (size 0), initialize with all then toggle one off
                            if (selectedStates.size === 0) {
                              const all = new Set(availableStates);
                              all.delete(s);
                              setSelectedStates(all);
                            } else {
                              toggleState(s);
                            }
                          }}
                        />
                      </label>
                    );
                  })
                ) : (
                  <div className="px-2 py-2 text-xs text-muted-foreground">State data not available</div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setAllStates(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setAllStates(false)}>
                  Clear All
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Note: If none selected, all states are shown.
              </div>
            </div>

            {/* FRD geometry authoring */}
            {isFRD && (
              <div className="mt-3 border-t pt-3">
                <Label className="text-sm font-medium">FRD Geometry</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={ensureDraw}>
                    Enable Draw
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDrawMode("draw_polygon")}>
                    <MousePointerClick className="h-3 w-3 mr-1" />
                    Draw Polygon
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDrawMode("direct_select")}>
                    <Square className="h-3 w-3 mr-1" />
                    Edit Vertices
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDrawMode("simple_select")}>
                    Stop
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearDraft}>
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button size="sm" onClick={() => saveGeometry("save")} disabled={!draftGeom || !selected || saving}>
                    <Save className="h-3 w-3 mr-1" /> Save Draft
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => saveGeometry("submit")} disabled={!draftGeom || !selected || saving}>
                    <Send className="h-3 w-3 mr-1" /> Submit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => saveGeometry("verify")} disabled={!draftGeom || !selected || saving}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Verify
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Select a claim, draw polygon(s), then Save/Submit/Verify. Multiple polygons saved as MultiPolygon.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right-side details panel (absolute overlay, no layout whitespace) */}
      {selected && (
        <div className="absolute right-3 top-3 bottom-3 z-20 w-[360px] max-w-[94vw]">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                {selected.props?.claim_identifier || `#${selected.id}`}
                <Button variant="ghost" size="icon" onClick={closeDetails} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs overflow-auto">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  style={{
                    backgroundColor:
                      STATUS_COLOR[(selected.props?.status || "").replace("-", "_")] || undefined,
                  }}
                >
                  {String(selected.props?.status || "-").replace("_", " ")}
                </Badge>
              </div>
              <InfoRow label="Claim ID" value={String(selected.id)} />
              <InfoRow label="Village" value={selected.props?.village || "-"} />
              <InfoRow label="Block" value={selected.props?.block || "-"} />
              <InfoRow label="GP" value={selected.props?.gram_panchayat || "-"} />
              <InfoRow label="State" value={selected.props?.state_name || selected.props?.state || selected.props?.state_code || String(selected.props?.state_id ?? "-")} />
              <InfoRow label="Claimed Area" value={selected.props?.claimed_area_ha != null ? `${selected.props.claimed_area_ha} ha` : "-"} />
              <InfoRow label="Geometry" value={selected.hasPolygon ? "Polygon present" : "Not provided"} />
              <div className="text-[11px] text-muted-foreground pt-2">
                Click another claim on the map to view. Close to return to full map.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map (full-bleed) */}
      <div ref={mapElRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function computePolygonsFC(fc: any) {
  const features = (fc.features || []).filter((f: any) =>
    ["Polygon", "MultiPolygon"].includes(f.geometry?.type)
  );
  features.forEach((f: any, i: number) => {
    if (f.properties) {
      if (f.properties.id == null && (f.id != null || i >= 0)) {
        f.properties.id = f.id ?? i + 1;
      }
      if (typeof f.properties.status === "string") {
        f.properties.status = f.properties.status.replace("-", "_");
      }
    }
  });
  return { type: "FeatureCollection", features };
}

function computePointsFC(fc: any) {
  const features: any[] = [];
  (fc.features || []).forEach((f: any, i: number) => {
    const props = { ...(f.properties || {}) };
    if (props.id == null) props.id = f.id ?? i + 1;
    if (typeof props.status === "string") props.status = props.status.replace("-", "_");

    let coords: [number, number] | null = null;
    try {
      if (f.geometry?.type && f.geometry.type !== "Point") {
        coords = turf.center(f).geometry.coordinates as [number, number];
      } else if (f.geometry?.type === "Point") {
        coords = f.geometry.coordinates as [number, number];
      }
    } catch {
      // ignore
    }
    if (!coords) return;
    features.push(turf.point(coords, props));
  });
  return { type: "FeatureCollection", features };
}

function applyFilters(map: Map, enabled: Record<ClaimStatusKey, boolean>, selectedStates: Set<string>) {
  const activeStatuses = Object.entries(enabled)
    .filter(([, on]) => on)
    .map(([k]) => k.replace("-", "_"));

  const statusExpr: any =
    activeStatuses.length > 0
      ? ["in", ["get", "status"], ["literal", activeStatuses]]
      : ["==", ["get", "status"], "__none__"];

  // State filter supports multiple possible keys on properties
  const states = Array.from(selectedStates);
  const stateExpr: any =
    states.length === 0
      ? true
      : [
          "any",
          ["in", ["get", "state"], ["literal", states]],
          ["in", ["get", "state_name"], ["literal", states]],
          ["in", ["get", "state_code"], ["literal", states]],
          ["in", ["to-string", ["get", "state_id"]], ["literal", states]],
        ];

  const combinedFilter: any = ["all", statusExpr, stateExpr];

  ["claim-points", "claim-point-labels", "claim-polygons-fill", "claim-polygons-outline"].forEach(
    (layerId) => {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, combinedFilter as any);
      }
    }
  );
}

function updateSelectedFilter(map: Map, id: number | string | null) {
  const filter = id == null ? ["==", "id", ""] : ["==", "id", id];
  if (map.getLayer("selected-polygon-outline")) {
    map.setFilter("selected-polygon-outline", filter as any);
  }
}

function flyToFeature(map: Map, feature: any) {
  let center: [number, number] | null = null;
  try {
    center = turf.center(feature).geometry.coordinates as [number, number];
  } catch {
    if (feature?.geometry?.type === "Point") {
      center = feature.geometry.coordinates as [number, number];
    }
  }
  if (center) {
    const targetZoom =
      feature?.geometry?.type && feature.geometry.type !== "Point"
        ? Math.max(POLY_MIN_ZOOM, 12)
        : Math.max(map.getZoom(), 10);
    map.flyTo({ center, zoom: targetZoom, essential: true });
  }
}

function hasPolygonById(fc: any, id: number | string) {
  return (fc.features || []).some(
    (f: any) =>
      (f.properties?.id ?? f.id) === id &&
      (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
  );
}

function findPropsById(fc: any, id: number | string) {
  const f = (fc.features || []).find((ff: any) => (ff.properties?.id ?? ff.id) === id);
  return f?.properties || {};
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value || "-"}</span>
  </div>
);