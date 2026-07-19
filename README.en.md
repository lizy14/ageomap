# Ageomap

[简体中文](README.md) | **English**

Render routes and markers on AMap (Gaode / 高德地图) Web JS API 2.0 vector maps directly inside a Grafana panel.

![Ageomap showing synthetic route data](src/img/screenshot.jpg)

> [!WARNING]
> Ageomap 0.1.0 stores the AMap Key and `securityJsCode` in dashboard JSON. This beta
> release is intended only for authenticated, trusted, self-hosted Grafana instances.
> Do not use it on anonymous or publicly shared dashboards.

## Features

- Native AMap vector rendering without an iframe, external page, or self-managed tile server.
- Routes and circle markers configured per Grafana query `refId`.
- Optional WGS-84 to GCJ-02 conversion through the official AMap JS API.
- Latitude and longitude field matching, per-query styles, and text-only hover tooltips.
- Grafana light/dark theme synchronization, toolbar, scale control, and automatic fit-to-data.

Ageomap is specialized for AMap. Grafana Geomap is generally a better fit for other basemap
providers, geohashes, heatmaps, and a broader set of general-purpose layers.

## Get started

1. Follow [Setup and configuration](docs/setup.en.md) to sideload the unsigned plugin and configure AMap credentials.
2. Read the [Usage guide](docs/usage.en.md) to prepare query data and configure routes, markers, and map styles.
3. See [Design and security](docs/design.en.md) for technical tradeoffs, data flow, security boundaries, and current limitations.

The current release is beta `0.1.0` and requires Grafana `12.3.0` or later. Unsigned plugins can
only be sideloaded into self-hosted Grafana OSS or Grafana Enterprise; they cannot be installed
on Grafana Cloud.

## Development provenance

This project was primarily designed and implemented by GitHub Copilot, under the product
direction, decisions, and review of its human maintainer.

## License and trademarks

The source code is licensed under the [Apache License 2.0](LICENSE). Use of AMap services is
subject to the applicable AMap terms and requires your own credentials. The Grafana Labs Marks,
AMap, and 高德地图 are trademarks of their respective owners; Ageomap is an independent
third-party project. See [Design and security](docs/design.en.md#trademarks-and-project-relationship)
for the full notice.
