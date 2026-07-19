# Usage guide

[简体中文](usage.md) | **English** | [Project home](../README.en.md) | [Setup](setup.en.md) | [Design and security](design.en.md)

## Prepare query data

Each Grafana query to be rendered should return a DataFrame containing:

- A latitude field, matched by `lat` by default
- A longitude field, matched by `(lon|lng)` by default
- Optional fields for hover tooltips

Coordinate matching is case-insensitive and accepts an exact field name or a regular expression.
An invalid regular expression is treated as literal text. Each query uses its `refId` (such as
`A` or `B`) to select how it is rendered.

Routes connect valid coordinates in query row order and require at least two valid points.
Markers draw one circle for each valid coordinate. Empty, non-numeric, and out-of-range values
outside latitude `[-90, 90]` or longitude `[-180, 180]` are ignored.

## Basic configuration

1. Create or edit a Grafana panel and select **Ageomap**.
2. Enter the AMap Key and `securityJsCode` as described in
   [Setup and configuration](setup.en.md#configure-amap-credentials).
3. Select the source coordinate system under data mapping.
4. Configure the latitude and longitude field matchers.
5. Use the per-`refId` JSON setting to render each query as a route, markers, or nothing.

The default source coordinate system is WGS-84. The panel converts it to GCJ-02 through the
official `AMap.convertFrom` API. Select GCJ-02 when the data is already converted to avoid applying
the conversion twice. Conversion runs sequentially in batches of up to 40 coordinate pairs,
following AMap's per-call limit. Failures and the 15-second timeout are displayed in the panel.

## Per-query configuration

The setting is a JSON object keyed by query `refId`:

```json
{
  "A": {
    "kind": "route",
    "color": "#1F60C4",
    "lineWidth": 4,
    "opacity": 0.6,
    "zIndex": 10
  },
  "B": {
    "kind": "marker",
    "color": "#C4162A",
    "radius": 5,
    "opacity": 0.8,
    "zIndex": 100,
    "labelFields": "name,value",
    "labelSuffix": " kWh"
  },
  "C": {
    "kind": "none"
  }
}
```

| Property      | Applies to    | Description                                      |
| ------------- | ------------- | ------------------------------------------------ |
| `kind`        | All           | `route`, `marker`, or `none`                     |
| `color`       | Route, marker | CSS color; falls back to the global default      |
| `opacity`     | Route, marker | Opacity; falls back to the global default        |
| `zIndex`      | Route, marker | AMap overlay stacking order                      |
| `lineWidth`   | Route         | Polyline width                                   |
| `radius`      | Marker        | Circle marker radius                             |
| `labelFields` | Marker        | Comma-separated exact field names for hover text |
| `labelSuffix` | Marker        | Text appended to numeric tooltip values          |

`labelFields` joins non-empty values in configuration order with `·`. Numeric values are rounded
to integers before `labelSuffix` is appended; strings are unchanged. Tooltip content is inserted
as text and is never executed as HTML.

When `kind` is omitted, the first DataFrame defaults to `route` and later DataFrames default to
`marker`. The default JSON, `{"A":{"kind":"route"}}`, explicitly configures query A as a route.

If the setting is invalid JSON, is not an object, contains an invalid property type, or has an
unsupported `kind`, the panel displays an error and does not render overlays.

## Global panel options

### Map styles

- **Follow Grafana**: choose separate map styles for light and dark Grafana themes.
- **Fixed**: always use one selected map style.

Available styles are `normal`, `dark`, `light`, `whitesmoke`, `fresh`, `grey`, `graffiti`,
`macaron`, `blue`, `darkblue`, and `wine`.

### View

- **Auto-fit to data**: asks AMap to fit the view when overlays exist.
- **Default zoom**: defaults to 11 and applies when auto-fit is disabled or data is not available.
- **Show toolbar**: loads the AMap `ToolBar` control.
- **Show scale**: loads the AMap `Scale` control.

### Default styles

Route options set the default color, width, and opacity. Marker options set the default color,
radius, and opacity. Matching properties in the per-`refId` configuration override these defaults.

## Troubleshooting

### The query has data but no overlay appears

Check the query `refId`, `kind`, coordinate field matchers, coordinate ranges, and coordinate
system. A route with only one valid point is not rendered.

### Hover text does not appear

Tooltips apply only to `marker`, and `labelFields` must use exact DataFrame field names. No tooltip
appears when all configured fields are empty for that row.

### Changing credentials reports that the SDK used different credentials

Reload the entire Grafana page. The AMap SDK is loaded once per page and does not support multiple
credential sets on the same page.
