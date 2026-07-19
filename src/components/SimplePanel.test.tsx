import React from 'react';
import { render, screen } from '@testing-library/react';
import { Field } from '@grafana/data';
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
