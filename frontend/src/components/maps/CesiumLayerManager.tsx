import {
  Viewer,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  WebMapTileServiceImageryProvider,
  UrlTemplateImageryProvider,
  SingleTileImageryProvider,
  Cesium3DTileset,
  GeoJsonDataSource,
  Color,
  ConstantProperty,
  ColorMaterialProperty,
} from "cesium";

export interface LayerConfig {
  id: string;
  name: string;
  type: "imagery" | "tileset" | "geojson";
  visible: boolean;
  opacity: number;
  url?: string;
  data?: object;
  color?: Color;
}

export class CesiumLayerManager {
  private viewer: Viewer;
  private layers: Map<
    string,
    {
      config: LayerConfig;
      layer: ImageryLayer | Cesium3DTileset | GeoJsonDataSource;
    }
  > = new Map();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async addLayer(config: LayerConfig): Promise<void> {
    try {
      let layer: ImageryLayer | Cesium3DTileset | GeoJsonDataSource;

      switch (config.type) {
        case "imagery":
          if (config.url) {
            const imageryProvider = new UrlTemplateImageryProvider({
              url: config.url,
            });
            layer =
              this.viewer.imageryLayers.addImageryProvider(imageryProvider);
            layer.alpha = config.opacity;
            layer.show = config.visible;
          } else {
            throw new Error("URL required for imagery layer");
          }
          break;

        case "tileset":
          if (config.url) {
            try {
              layer = await Cesium3DTileset.fromUrl(config.url);
              this.viewer.scene.primitives.add(layer);
              layer.show = config.visible;
            } catch (error) {
              console.warn(`Could not load tileset from ${config.url}:`, error);
              throw error;
            }
          } else {
            throw new Error("URL required for tileset layer");
          }
          break;

        case "geojson":
          if (config.data || config.url) {
            if (config.url) {
              layer = await GeoJsonDataSource.load(config.url);
            } else {
              layer = await GeoJsonDataSource.load(config.data);
            }
            this.viewer.dataSources.add(layer);
            layer.show = config.visible;

            // Apply styling
            if (config.color) {
              const entities = layer.entities.values;
              for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if (entity.polygon) {
                  entity.polygon.material = new ColorMaterialProperty(
                    config.color.withAlpha(config.opacity)
                  );
                  entity.polygon.outline = new ConstantProperty(true);
                  entity.polygon.outlineColor = new ConstantProperty(
                    config.color
                  );
                }
                if (entity.polyline) {
                  entity.polyline.material = new ColorMaterialProperty(
                    config.color
                  );
                }
              }
            }
          } else {
            throw new Error("Data or URL required for GeoJSON layer");
          }
          break;

        default:
          throw new Error(`Unsupported layer type: ${config.type}`);
      }

      this.layers.set(config.id, { config, layer });
    } catch (error) {
      console.error(`Error adding layer ${config.name}:`, error);
    }
  }

  removeLayer(layerId: string): void {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo) {
      const { layer } = layerInfo;

      if (layer instanceof ImageryLayer) {
        this.viewer.imageryLayers.remove(layer);
      } else if (layer instanceof Cesium3DTileset) {
        this.viewer.scene.primitives.remove(layer);
      } else if (layer instanceof GeoJsonDataSource) {
        this.viewer.dataSources.remove(layer);
      }

      this.layers.delete(layerId);
    }
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo) {
      layerInfo.config.visible = visible;
      layerInfo.layer.show = visible;
    }
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    const layerInfo = this.layers.get(layerId);
    if (layerInfo) {
      layerInfo.config.opacity = opacity;

      if (layerInfo.layer instanceof ImageryLayer) {
        layerInfo.layer.alpha = opacity;
      } else if (
        layerInfo.layer instanceof GeoJsonDataSource &&
        layerInfo.config.color
      ) {
        // Update GeoJSON opacity
        const entities = layerInfo.layer.entities.values;
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          if (entity.polygon) {
            entity.polygon.material = new ColorMaterialProperty(
              layerInfo.config.color.withAlpha(opacity)
            );
          }
        }
      }
    }
  }

  getLayer(
    layerId: string
  ):
    | {
        config: LayerConfig;
        layer: ImageryLayer | Cesium3DTileset | GeoJsonDataSource;
      }
    | undefined {
    return this.layers.get(layerId);
  }

  getAllLayers(): LayerConfig[] {
    return Array.from(this.layers.values()).map(
      (layerInfo) => layerInfo.config
    );
  }

  // Predefined layer configurations for common forest management layers
  static getForestLayerConfigs(): LayerConfig[] {
    return [
      {
        id: "forest-boundaries",
        name: "Forest Boundaries",
        type: "geojson",
        visible: true,
        opacity: 0.7,
        color: Color.GREEN,
        // In a real app, this would point to actual GeoJSON data
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [73.6, 24.5],
                    [73.8, 24.5],
                    [73.8, 24.7],
                    [73.6, 24.7],
                    [73.6, 24.5],
                  ],
                ],
              },
              properties: {
                name: "Forest Area 1",
                type: "Reserved Forest",
              },
            },
          ],
        },
      },
      {
        id: "revenue-boundaries",
        name: "Revenue Boundaries",
        type: "geojson",
        visible: true,
        opacity: 0.5,
        color: Color.BLUE,
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [73.5, 24.4],
                    [73.9, 24.4],
                    [73.9, 24.8],
                    [73.5, 24.8],
                    [73.5, 24.4],
                  ],
                ],
              },
              properties: {
                name: "Revenue Circle 1",
                type: "Revenue Land",
              },
            },
          ],
        },
      },
      {
        id: "cfr-polygons",
        name: "Community Forest Rights",
        type: "geojson",
        visible: true,
        opacity: 0.6,
        color: Color.ORANGE,
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [73.65, 24.55],
                    [73.75, 24.55],
                    [73.75, 24.65],
                    [73.65, 24.65],
                    [73.65, 24.55],
                  ],
                ],
              },
              properties: {
                name: "CFR Area 1",
                type: "Community Forest Rights",
              },
            },
          ],
        },
      },
    ];
  }
}

export default CesiumLayerManager;
