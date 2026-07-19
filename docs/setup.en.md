# Setup and configuration

[简体中文](setup.md) | **English** | [Project home](../README.en.md) | [Usage guide](usage.en.md) | [Design and security](design.en.md)

## Requirements

- Self-hosted Grafana OSS or Grafana Enterprise `12.3.0` or later
- A build environment with Node.js 22 (only when building from source)
- An AMap Web (JS API) Key and `securityJsCode`

Grafana Cloud does not support sideloading unsigned plugins.

## Install the plugin

The plugin ID is `lizy14-ageomap-panel`. Whether you use a release archive or build from source,
the final plugin directory must contain `plugin.json` directly:

```text
/var/lib/grafana/plugins/lizy14-ageomap-panel/plugin.json
```

### Use a release archive

Download an archive from [GitHub Releases](https://github.com/lizy14/ageomap/releases), extract
it, and place the `lizy14-ageomap-panel` directory in the Grafana plugin directory.

### Build from source

```bash
npm install
npm run build
sudo mkdir -p /var/lib/grafana/plugins/lizy14-ageomap-panel
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

The repository's `.nvmrc` specifies Node.js 22, and `package.json` specifies npm 11.

## Allow the unsigned plugin

For a package or system-service installation, add this to `grafana.ini`:

```ini
[plugins]
allow_loading_unsigned_plugins = lizy14-ageomap-panel
```

For Docker or Docker Compose:

```yaml
environment:
  - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=lizy14-ageomap-panel
volumes:
  - /path/to/ageomap/dist:/var/lib/grafana/plugins/lizy14-ageomap-panel:ro
```

Use a comma-separated list when allowing multiple unsigned plugins. Restart Grafana after
installing or updating the plugin:

```bash
sudo systemctl restart grafana-server
# or
docker compose restart grafana
```

Grafana records an unsigned-plugin warning in its server log. This is expected when sideloading.

## Configure AMap credentials

1. Create an AMap **Web (JS API) Key** and `securityJsCode` in the
   [AMap console](https://console.amap.com/dev/key/app).
2. Restrict the Key to the exact domain hosting Grafana and configure appropriate quota alerts.
3. Add the **Ageomap** visualization in Grafana.
4. Enter the Key and `securityJsCode` under the panel's AMap credential options.
5. Follow the [Usage guide](usage.en.md) to configure coordinate fields and query `refId` values.

> [!CAUTION]
> The current release stores both values as regular panel options in dashboard JSON. Grafana
> does not encrypt them, and users who can view or export the dashboard may be able to read them.

Disable anonymous access, restrict dashboard access to trusted users, do not commit dashboards
containing credentials, and do not publish them as Grafana snapshots. Use separate Keys for
separate deployments. Rotate the Key and `securityJsCode` if a dashboard or browser session is
exposed. See [Design and security](design.en.md#security-and-privacy) for the complete boundary.

Changing credentials after the SDK has loaded requires reloading the entire Grafana page.
Different AMap credentials cannot be used on the same Grafana page.

## Update

For release installations, replace the old plugin directory with the complete new directory.
For source installations, run:

```bash
npm install
npm run build
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

Then restart Grafana. Do not merge files from old and new builds.

## Local development

Install dependencies and run the existing checks:

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

The development server uses Docker Compose:

```bash
npm run server
```

End-to-end tests require Docker and Playwright browsers:

```bash
npm run e2e
```

The repository's development Compose configuration allows `lizy14-ageomap-panel` and provisions
a test dashboard and the TestData DB data source.

## Troubleshooting

### Grafana cannot find the plugin

Confirm that `plugin.json` is directly inside the plugin directory, the allowed unsigned plugin
ID is exactly `lizy14-ageomap-panel`, and Grafana has been restarted.

### The panel reports missing AMap credentials

Both the Key and `securityJsCode` are required by the current release. Confirm that both are set
in the current panel's AMap credential options.

### The SDK fails to load or times out

Check the Key type, `securityJsCode`, domain allowlist, network access, and AMap quota. Reload the
Grafana page after changing credentials.
