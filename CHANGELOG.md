# Changelog

## 0.1.0

Initial beta release.

- Render AMap Web JS API 2.0 vector maps in a native Grafana panel.
- Draw routes and circle markers from Grafana data frames.
- Configure each query by `refId`, including colors, opacity, dimensions, z-index, and tooltip fields.
- Optionally convert WGS-84 coordinates to GCJ-02 in the browser.
- Follow Grafana light and dark themes with configurable map styles.
- Load the AMap SDK without allowing Grafana's AMD loader to capture it.
- Treat tooltip values as text to prevent HTML injection.
- Validate coordinates and series configuration before rendering.

### Known limitations

- The AMap Key and `securityJsCode` are stored in dashboard JSON and are visible to users who can view or export the dashboard.
- Only authenticated, trusted, self-hosted Grafana instances are recommended for this beta release.
- Grafana Cloud does not support sideloading this unsigned plugin.
- Changing AMap credentials after the SDK has loaded requires reloading the Grafana page.
- Multiple AMap credentials on the same Grafana page are not supported.
- Server-side `securityJsCode` storage and proxy mode are planned for a future release.
