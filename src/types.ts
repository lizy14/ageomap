export type CoordSystem = 'gcj02' | 'wgs84';
export type MapStyle = 'normal' | 'dark' | 'light' | 'whitesmoke' | 'fresh' | 'grey' | 'graffiti' | 'macaron' | 'blue' | 'darkblue' | 'wine';
export type ThemeMode = 'follow' | 'fixed';

export interface SeriesMapping {
  refId: string;
  kind: 'route' | 'marker' | 'none';
  color: string;
  radius: number;
  opacity: number;
  zIndex: number;
  lineWidth: number;
  labelFields: string; // comma-separated field names for hover tooltip
  labelSuffix: string; // appended to numeric label (e.g. ' kWh')
}

export interface AMapOptions {
  amapKey: string;
  amapSecurity: string;
  themeMode: ThemeMode; // 'follow' = follow Grafana light/dark; 'fixed' = always use mapStyle
  mapStyle: MapStyle; // used when themeMode = 'fixed'
  lightMapStyle: MapStyle; // used when themeMode = 'follow' and Grafana is light
  darkMapStyle: MapStyle; // used when themeMode = 'follow' and Grafana is dark
  coordSystem: CoordSystem; // source coordinate system of the data
  latField: string; // regex or exact field name matcher
  lonField: string;
  autoFit: boolean;
  defaultZoom: number;
  showToolbar: boolean;
  showScale: boolean;
  seriesConfig: string; // JSON: { "A": {kind:"route",color,...}, "B": {...} }
  routeColor: string;
  routeWidth: number;
  routeOpacity: number;
  markerColor: string;
  markerRadius: number;
  markerOpacity: number;
}
