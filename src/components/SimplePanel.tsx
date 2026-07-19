import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelProps, DataFrame, Field } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { AMapOptions, SeriesMapping } from '../types';
import { loadAMap } from '../amapLoader';
import { convertGpsCoordinates, Coordinate } from '../amapConvert';

interface Props extends PanelProps<AMapOptions> {}

function fieldByRegex(frame: DataFrame, pattern: string): Field | undefined {
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'i');
  } catch {
    re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  return frame.fields.find((f) => re.test(f.name));
}

function fieldByName(frame: DataFrame, name: string): Field | undefined {
  return frame.fields.find((f) => f.name === name);
}

interface ParsedSeriesConfig {
  value: Record<string, Partial<SeriesMapping>>;
  error: string | null;
}

function parseSeriesConfig(json: string): ParsedSeriesConfig {
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      return { value: {}, error: '按 refId 配置必须是 JSON 对象' };
    }
    const value: Record<string, Partial<SeriesMapping>> = {};
    for (const [refId, raw] of Object.entries(v)) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { value: {}, error: `${refId} 的配置必须是 JSON 对象` };
      }
      const input = raw as Record<string, unknown>;
      const config: Partial<SeriesMapping> = {};
      if (input.kind != null) {
        if (input.kind !== 'route' && input.kind !== 'marker' && input.kind !== 'none') {
          return { value: {}, error: `${refId}.kind 必须是 route、marker 或 none` };
        }
        config.kind = input.kind;
      }
      for (const field of ['color', 'labelFields', 'labelSuffix'] as const) {
        if (input[field] != null) {
          if (typeof input[field] !== 'string') {
            return { value: {}, error: `${refId}.${field} 必须是字符串` };
          }
          config[field] = input[field];
        }
      }
      for (const field of ['radius', 'opacity', 'zIndex', 'lineWidth'] as const) {
        if (input[field] != null) {
          if (typeof input[field] !== 'number' || !Number.isFinite(input[field])) {
            return { value: {}, error: `${refId}.${field} 必须是有效数字` };
          }
          config[field] = input[field];
        }
      }
      value[refId] = config;
    }
    return { value, error: null };
  } catch {
    return { value: {}, error: '按 refId 配置不是有效的 JSON' };
  }
}

export function createTooltipContent(text: string): HTMLDivElement {
  const content = document.createElement('div');
  content.style.fontSize = '12px';
  content.style.padding = '2px 6px';
  content.textContent = text;
  return content;
}

export function coordinateAt(latField: Field, lonField: Field, index: number): Coordinate | null {
  const rawLat = latField.values[index];
  const rawLon = lonField.values[index];
  if (rawLat == null || rawLon == null || (typeof rawLat === 'string' && !rawLat.trim()) || (typeof rawLon === 'string' && !rawLon.trim())) {
    return null;
  }
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  return [lon, lat];
}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const toolbarRef = useRef<any>(null);
  const scaleRef = useRef<any>(null);
  const drawVersionRef = useRef(0);
  const [mapVersion, setMapVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const credentialsMissing = !options.amapKey || !options.amapSecurity;
  const seriesConfig = useMemo(() => parseSeriesConfig(options.seriesConfig), [options.seriesConfig]);

  // Resolve the AMap style: follow Grafana's light/dark theme, or use a fixed style.
  const effectiveStyle =
    options.themeMode === 'fixed'
      ? options.mapStyle || 'normal'
      : theme.isDark
        ? options.darkMapStyle || 'dark'
        : options.lightMapStyle || 'normal';

  const draw = useCallback(async () => {
    const drawVersion = ++drawVersionRef.current;
    const AMap = window.AMap;
    const map = mapRef.current;
    if (!AMap || !map) {
      return;
    }
    overlaysRef.current.forEach((o) => map.remove(o));
    overlaysRef.current = [];

    const sc = seriesConfig.value;
    const prepared: Array<{
      frame: DataFrame;
      kind: 'route' | 'marker';
      cfg: Partial<SeriesMapping>;
      points: Array<{ rowIndex: number; coordinate: Coordinate }>;
    }> = [];

    (data.series || []).forEach((frame, idx) => {
      const refId = frame.refId || String(idx);
      const cfg = sc[refId] || {};
      const kind = cfg.kind || (idx === 0 ? 'route' : 'marker');
      if (kind === 'none') {
        return;
      }
      const latF = fieldByRegex(frame, options.latField || 'lat');
      const lonF = fieldByRegex(frame, options.lonField || '(lon|lng)');
      if (!latF || !lonF) {
        return;
      }
      const points: Array<{ rowIndex: number; coordinate: Coordinate }> = [];
      for (let rowIndex = 0; rowIndex < latF.values.length; rowIndex++) {
        const coordinate = coordinateAt(latF, lonF, rowIndex);
        if (coordinate) {
          points.push({ rowIndex, coordinate });
        }
      }
      if (points.length) {
        prepared.push({ frame, kind, cfg, points });
      }
    });

    const rawCoordinates = prepared.flatMap((series) => series.points.map((point) => point.coordinate));
    let coordinates = rawCoordinates;
    if (options.coordSystem !== 'gcj02') {
      try {
        coordinates = await convertGpsCoordinates(
          AMap,
          rawCoordinates,
          () => drawVersion === drawVersionRef.current && mapRef.current === map
        );
      } catch (error) {
        if (drawVersion === drawVersionRef.current && mapRef.current === map) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
        return;
      }
    }
    if (drawVersion !== drawVersionRef.current || mapRef.current !== map) {
      return;
    }
    setLoadError(null);

    const overlays: any[] = [];
    let coordinateIndex = 0;

    prepared.forEach(({ frame, kind, cfg, points }) => {
      if (kind === 'route') {
        const path = points.map(() => coordinates[coordinateIndex++]);
        if (path.length > 1) {
          const pl = new AMap.Polyline({
            path,
            strokeColor: cfg.color || options.routeColor || '#1F60C4',
            strokeWeight: cfg.lineWidth ?? options.routeWidth ?? 4,
            strokeOpacity: cfg.opacity != null ? cfg.opacity : options.routeOpacity != null ? options.routeOpacity : 0.6,
            lineJoin: 'round',
            lineCap: 'round',
            zIndex: cfg.zIndex ?? 10,
          });
          map.add(pl);
          overlays.push(pl);
        }
      } else {
        const labelFieldNames = (cfg.labelFields || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const labelFields = labelFieldNames.map((nm) => fieldByName(frame, nm));
        for (const point of points) {
          const pos = coordinates[coordinateIndex++];
          const cm = new AMap.CircleMarker({
            center: pos,
            radius: cfg.radius ?? options.markerRadius ?? 5,
            fillColor: cfg.color || options.markerColor || '#C4162A',
            fillOpacity: cfg.opacity != null ? cfg.opacity : options.markerOpacity != null ? options.markerOpacity : 0.8,
            strokeColor: '#fff',
            strokeWeight: 1,
            strokeOpacity: 0.9,
            cursor: 'pointer',
            zIndex: cfg.zIndex ?? 100,
            bubble: true,
          });
          map.add(cm);
          overlays.push(cm);
          if (labelFields.length) {
            let title = '';
            labelFields.forEach((f) => {
              if (!f) {
                return;
              }
              let v: any = f.values[point.rowIndex];
              if (v == null) {
                return;
              }
              if (typeof v === 'number') {
                v = Math.round(v) + (cfg.labelSuffix || '');
              }
              title += (title ? ' · ' : '') + v;
            });
            if (title) {
              cm.on('mouseover', () => {
                infoRef.current.setContent(createTooltipContent(title));
                infoRef.current.open(map, pos);
              });
              cm.on('mouseout', () => infoRef.current.close());
            }
          }
        }
      }
    });

    overlaysRef.current = overlays;
    if (options.autoFit && overlays.length) {
      map.setFitView(overlays, false, [24, 24, 24, 24]);
    }
  }, [data, options, seriesConfig.value]);

  // Load SDK and create the map instance once.
  useEffect(() => {
    drawVersionRef.current += 1;
    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
      infoRef.current = null;
      overlaysRef.current = [];
      toolbarRef.current = null;
      scaleRef.current = null;
    }
    if (!options.amapKey || !options.amapSecurity) {
      return;
    }
    let cancelled = false;
    loadAMap(options.amapKey, options.amapSecurity)
      .then((AMap) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        if (!mapRef.current) {
          mapRef.current = new AMap.Map(containerRef.current, {
            viewMode: '2D',
            zoom: 11,
            center: [116.397, 39.909],
            mapStyle: 'amap://styles/normal',
          });
          infoRef.current = new AMap.InfoWindow({ isCustom: false, offset: new AMap.Pixel(0, -6), autoMove: true });
        }
        setLoadError(null);
        setMapVersion((version) => version + 1);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(String(e.message || e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [options.amapKey, options.amapSecurity]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(options.defaultZoom || 11);
    }
  }, [mapVersion, options.defaultZoom]);

  useEffect(() => {
    const AMap = window.AMap;
    const map = mapRef.current;
    if (!mapVersion || !AMap || !map) {
      return;
    }
    let cancelled = false;

    if (!options.showToolbar && toolbarRef.current) {
      map.removeControl(toolbarRef.current);
      toolbarRef.current = null;
    } else if (options.showToolbar && !toolbarRef.current) {
      AMap.plugin('AMap.ToolBar', () => {
        if (!cancelled && mapRef.current === map && !toolbarRef.current) {
          toolbarRef.current = new AMap.ToolBar();
          map.addControl(toolbarRef.current);
        }
      });
    }

    if (!options.showScale && scaleRef.current) {
      map.removeControl(scaleRef.current);
      scaleRef.current = null;
    } else if (options.showScale && !scaleRef.current) {
      AMap.plugin('AMap.Scale', () => {
        if (!cancelled && mapRef.current === map && !scaleRef.current) {
          scaleRef.current = new AMap.Scale();
          map.addControl(scaleRef.current);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [mapVersion, options.showScale, options.showToolbar]);

  // Redraw when the map is ready or data/style changes.
  useEffect(() => {
    if (mapVersion && mapRef.current) {
      mapRef.current.setMapStyle(`amap://styles/${effectiveStyle}`);
      void draw();
    }
  }, [mapVersion, draw, effectiveStyle]);

  // Keep the map sized to the panel.
  useEffect(() => {
    if (mapRef.current && mapRef.current.resize) {
      mapRef.current.resize();
    }
  }, [width, height]);

  useEffect(() => {
    return () => {
      drawVersionRef.current += 1;
      overlaysRef.current.forEach((overlay) => mapRef.current?.remove(overlay));
      overlaysRef.current = [];
      infoRef.current?.close();
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      infoRef.current = null;
      toolbarRef.current = null;
      scaleRef.current = null;
    };
  }, []);

  const message = seriesConfig.error || (credentialsMissing ? '请在面板选项里填写高德 Key 和 securityJsCode' : loadError);

  return (
    <div style={{ position: 'relative', width, height }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {message && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            color: '#d44',
            background: 'rgba(0,0,0,0.6)',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          Ageomap: {message}
        </div>
      )}
    </div>
  );
};
