import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Field, FieldType } from '@grafana/data';
import { coordinateAt, createTooltipContent, SimplePanel } from './SimplePanel';
import { AMapOptions } from '../types';

const options: AMapOptions = {
  amapKey: '',
  amapSecurity: '',
  themeMode: 'follow',
  mapStyle: 'normal',
  lightMapStyle: 'normal',
  darkMapStyle: 'dark',
  coordSystem: 'wgs84',
  latField: 'lat',
  lonField: '(lon|lng)',
  autoFit: true,
  defaultZoom: 11,
  showToolbar: false,
  showScale: false,
  seriesConfig: '{"A":{"kind":"route"}}',
  routeColor: '#1F60C4',
  routeWidth: 4,
  routeOpacity: 0.6,
  markerColor: '#C4162A',
  markerRadius: 5,
  markerOpacity: 0.8,
};

const props: any = {
  options,
  data: { series: [] },
  width: 400,
  height: 300,
};

test('shows a hint when the AMap key is missing', async () => {
  render(<SimplePanel {...props} />);
  expect(await screen.findByText(/高德 Key/)).toBeInTheDocument();
});

test('renders tooltip text without interpreting HTML', () => {
  const content = createTooltipContent('<img src=x onerror=alert(1)>');
  expect(content.textContent).toBe('<img src=x onerror=alert(1)>');
  expect(content.querySelector('img')).toBeNull();
});

test('shows invalid series JSON instead of silently ignoring it', async () => {
  render(<SimplePanel {...props} options={{ ...options, seriesConfig: '{' }} />);
  expect(await screen.findByText(/不是有效的 JSON/)).toBeInTheDocument();
});

test('rejects invalid nested series configuration', async () => {
  render(<SimplePanel {...props} options={{ ...options, seriesConfig: '{"A":{"labelFields":["name"]}}' }} />);
  expect(await screen.findByText(/A\.labelFields 必须是字符串/)).toBeInTheDocument();
});

test('does not convert missing coordinates to zero', () => {
  const field = (values: unknown[]) => ({ values } as unknown as Field);
  expect(coordinateAt(field([null]), field([121.5]), 0)).toBeNull();
  expect(coordinateAt(field(['']), field([121.5]), 0)).toBeNull();
});

test('shows conversion progress and retains old overlays until the preview is ready', async () => {
  const map = {
    add: jest.fn(),
    remove: jest.fn(),
    setFitView: jest.fn(),
    setMapStyle: jest.fn(),
    setZoom: jest.fn(),
    destroy: jest.fn(),
    resize: jest.fn(),
  };
  let finishConversion: (() => void) | undefined;
  window.AMap = {
    Map: jest.fn(() => map),
    InfoWindow: jest.fn(() => ({ close: jest.fn(), open: jest.fn(), setContent: jest.fn() })),
    Pixel: jest.fn(),
    Polyline: jest.fn(() => ({ setPath: jest.fn() })),
    CircleMarker: jest.fn(() => ({ on: jest.fn() })),
    convertFrom: jest.fn((coordinates, _type, callback) => {
      finishConversion = () =>
        callback('complete', {
          info: 'ok',
          locations: coordinates.map(([lng, lat]: [number, number]) => ({
            getLng: () => lng + 0.01,
            getLat: () => lat + 0.01,
          })),
        });
    }),
  };
  const data = {
    series: [
      {
        refId: 'A',
        fields: [
          { name: 'time', type: FieldType.time, values: [100, 200] },
          { name: 'lat', type: FieldType.number, values: [39, 39.1] },
          { name: 'lon', type: FieldType.number, values: [116, 116.1] },
        ],
      },
    ],
  };

  const panelProps = {
    ...props,
    data,
    options: { ...options, amapKey: 'test-key', amapSecurity: 'test-security', coordSystem: 'gcj02' as const },
  };
  const { rerender, unmount } = render(
    <SimplePanel
      {...panelProps}
    />
  );

  await waitFor(() => expect(map.add).toHaveBeenCalled());
  map.remove.mockClear();
  rerender(<SimplePanel {...panelProps} options={{ ...panelProps.options, coordSystem: 'wgs84' }} />);
  expect(await screen.findByRole('status')).toHaveTextContent('正在转换坐标 0 / 2');
  expect(map.remove).not.toHaveBeenCalled();
  await act(async () => finishConversion?.());
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(map.remove).toHaveBeenCalled();

  unmount();
  delete window.AMap;
});
