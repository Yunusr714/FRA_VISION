import { useEffect, useRef, useState } from "react";
import {
  Viewer,
  CesiumTerrainProvider,
  Ion,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  BingMapsImageryProvider,
  BingMapsStyle,
  UrlTemplateImageryProvider,
  Cartesian3,
  Math as CesiumMath,
  Color,
  Entity,
  PointGraphics,
  LabelGraphics,
  HorizontalOrigin,
  VerticalOrigin,
  HeightReference,
  Cesium3DTileset,
  IonResource,
  Cesium3DTileStyle,
} from "cesium";

// Extend window type for Cesium
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// Set Cesium's base URL
window.CESIUM_BASE_URL = "/cesium/";
// Disable Ion for offline/free usage
Ion.defaultAccessToken = "";

export interface CesiumMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  onViewerReady?: (viewer: Viewer) => void;
  terrainEnabled?: boolean;
  buildingsEnabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  layer?: ImageryLayer;
}

const CesiumMap: React.FC<CesiumMapProps> = ({
  center = [18.4, 83.6], // Default to Rajasthan coordinates
  zoom = 10,
  onViewerReady,
  terrainEnabled = true,
  buildingsEnabled = true,
  className = "w-full h-full",
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initializingRef = useRef(false); // Track initialization state

  useEffect(() => {
    if (!containerRef.current || viewerRef.current || initializingRef.current)
      return; // Prevent double initialization

    initializingRef.current = true; // Mark as initializing

    const initViewer = async () => {
      try {
        // Create the Cesium viewer without Ion terrain initially
        const viewer = new Viewer(containerRef.current!, {
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          infoBox: true,
          selectionIndicator: true,
          shadows: true,
          terrainShadows: 1,
        });

        // Set the initial camera position for better 3D view
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            center[0],
            center[1],
            zoom * 50000
          ), // Lower altitude for better detail
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-60), // More tilted angle for 3D effect
            roll: 0.0,
          },
        });

        // Add high-resolution satellite imagery instead of OSM
        // Remove default imagery first
        viewer.imageryLayers.removeAll();

        // Try to add satellite imagery with multiple fallbacks
        try {
          // Try Google Satellite (via URL template - free but has usage limits)
          const satelliteImageryProvider = new UrlTemplateImageryProvider({
            url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            credit: "Google Satellite",
          });
          viewer.imageryLayers.addImageryProvider(satelliteImageryProvider);
        } catch (error) {
          console.warn("Could not load satellite imagery, trying ESRI:", error);

          // Fallback to ESRI World Imagery (free)
          try {
            const esriImageryProvider = new UrlTemplateImageryProvider({
              url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              credit: "ESRI World Imagery",
            });
            viewer.imageryLayers.addImageryProvider(esriImageryProvider);
          } catch (esriError) {
            console.warn(
              "Could not load ESRI imagery, using OpenStreetMap fallback:",
              esriError
            );
            // Fallback to OSM if all else fails
            const osmImageryProvider = new OpenStreetMapImageryProvider({
              url: "https://a.tile.openstreetmap.org/",
            });
            viewer.imageryLayers.addImageryProvider(osmImageryProvider);
          }
        }

        // Try to add terrain if enabled (fallback gracefully)
        if (terrainEnabled) {
          try {
            const terrainProvider = await CesiumTerrainProvider.fromIonAssetId(
              1
            );
            viewer.terrainProvider = terrainProvider;
          } catch (error) {
            console.warn(
              "Could not load terrain data - using default ellipsoid:",
              error
            );
          }
        }

        // Try to add OSM Buildings if enabled (fallback gracefully)
        if (buildingsEnabled) {
          try {
            const osmBuildingsTileset = await Cesium3DTileset.fromIonAssetId(
              96188
            );
            viewer.scene.primitives.add(osmBuildingsTileset);

            // Style the buildings
            osmBuildingsTileset.style = new Cesium3DTileStyle({
              color: "rgba(255, 255, 255, 0.8)",
              show: true,
            });
          } catch (error) {
            console.warn(
              "Could not load OSM Buildings - continuing without 3D buildings:",
              error
            );
          }
        }

        // Enable enhanced lighting and atmosphere for better 3D effect
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.dynamicAtmosphereLightingFromSun = true;
        viewer.scene.globe.showGroundAtmosphere = true;

        // Enhanced fog and atmosphere
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0001;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

        // Store viewer reference
        viewerRef.current = viewer;
        setIsReady(true);
        initializingRef.current = false; // Mark as complete

        // Call ready callback
        if (onViewerReady) {
          onViewerReady(viewer);
        }
      } catch (error) {
        console.error("Error initializing Cesium viewer:", error);
        initializingRef.current = false; // Reset on error
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        setIsReady(false);
        initializingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to prevent re-initialization

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full" />
      {isReady && children}
    </div>
  );
};

export default CesiumMap;
