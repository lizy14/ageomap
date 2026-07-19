# Ageomap

[English](#english) | [中文](#中文)

> **Trademark notice / 商标声明**
>
> The Grafana Labs Marks are trademarks of Grafana Labs, and are used with Grafana Labs' permission. We are not affiliated with, endorsed or sponsored by Grafana Labs or its affiliates.
>
> AMap and 高德地图 are trademarks of their respective owners. Ageomap is an independent third-party project and is not affiliated with, endorsed or sponsored by AMap, 高德地图, or their affiliates.
>
> Grafana Labs 标志是 Grafana Labs 的商标，本项目依照 Grafana Labs 的许可使用这些标志。本项目与 Grafana Labs 或其关联方不存在隶属关系，亦未获得其认可、背书或赞助。
>
> AMap 和高德地图是其各自权利人的商标。Ageomap 是独立第三方项目，与 AMap、高德地图或其关联方不存在隶属关系，亦未获得其认可、背书或赞助。

![Ageomap showing synthetic route data](https://raw.githubusercontent.com/lizy14/ageomap/main/src/img/screenshot.jpg)

## English

> [!WARNING]
> Ageomap 0.1.0 uses AMap's direct browser authentication mode. The AMap Key and `securityJsCode` are stored in dashboard JSON and are visible to users who can view or export the dashboard. Use this beta release only on authenticated, trusted, self-hosted Grafana instances. Do not use it on anonymous or publicly shared dashboards.

### Overview

Ageomap is a beta Grafana panel plugin that renders geographic data on **AMap (Gaode / 高德地图) Web JS API 2.0** vector maps. It runs directly inside the panel without an iframe, external page, or self-managed tile server.

### Features

- Native AMap Web JS API 2.0 vector rendering.
- Routes (polylines) and circle markers configured per query `refId`.
- Optional WGS-84 to GCJ-02 conversion in the browser.
- Latitude and longitude field matching by exact name or regular expression.
- Per-series color, opacity, radius, line width, z-index, and text-only hover tooltips.
- Automatic synchronization with Grafana's light and dark themes.
- Configurable AMap styles for light, dark, and fixed-theme modes.
- Optional toolbar, scale control, and automatic fit-to-data.

### Why not use AMap XYZ tiles in Grafana Geomap?

Grafana Geomap can display an XYZ URL, including AMap raster-tile patterns. Ageomap uses the official AMap Web JS API instead:

| AMap XYZ tiles in Geomap | Ageomap |
| --- | --- |
| Raster images at fixed zoom levels | Native AMap 2.0 vector rendering with smooth, continuous zoom |
| Labeled 256 px tiles can look soft on high-DPI screens | Sharp labels, roads, and POIs rendered by the AMap vector engine |
| A single tile style does not follow Grafana light/dark mode | Separate light and dark AMap styles can follow Grafana automatically |
| WGS-84 coordinates must be converted elsewhere | Optional conversion is built into the panel |
| Often relies on undocumented tile URL patterns | Uses the official AMap Web JS API |
| OpenLayers renders overlays separately | Routes, markers, and hover information use native AMap objects |

Ageomap is specialized for AMap. Grafana Geomap remains the better general-purpose choice for other basemap providers, geohashes, lookup layers, heatmaps, and its broader set of built-in layer types.

### Sideload the unsigned plugin

Unsigned plugins can only be sideloaded into self-hosted Grafana OSS or Grafana Enterprise. Grafana Cloud does not support unsigned plugins.

#### Install from a release ZIP

Download the release archive and extract it into the Grafana plugin directory. The resulting path must contain `plugin.json` directly:

```text
/var/lib/grafana/plugins/lizy14-ageomap-panel/plugin.json
```

#### Build from source

```bash
npm install
npm run build
sudo mkdir -p /var/lib/grafana/plugins/lizy14-ageomap-panel
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

#### Allow the unsigned plugin

For a package or system installation, add this to `grafana.ini`:

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

Use a comma-separated list when allowing multiple unsigned plugins. Restart Grafana after installing or updating the plugin:

```bash
sudo systemctl restart grafana-server
# or
docker compose restart grafana
```

Grafana records an unsigned-plugin warning in its server log. This is expected when sideloading.

### Configure AMap

1. Create an AMap **Web (JS API) Key** and `securityJsCode` at <https://console.amap.com/dev/key/app>.
2. Restrict the Key to the exact domain that hosts your Grafana instance.
3. Add the **Ageomap** visualization and enter the Key and `securityJsCode` in the panel options.
4. Create queries that return latitude and longitude fields.
5. Configure each query `refId` as a `route`, `marker`, or `none`.

Example:

```json
{
  "A": { "kind": "route" },
  "B": {
    "kind": "marker",
    "color": "#C4162A",
    "labelFields": "name,value",
    "labelSuffix": " kWh"
  }
}
```

### Security and privacy

- The AMap Key and `securityJsCode` are regular panel options in this beta release. They are not encrypted by Grafana.
- Anyone who can view or export the dashboard can potentially read these values.
- Do not commit dashboards containing credentials or publish them as Grafana snapshots.
- Disable anonymous access and restrict dashboard access to trusted users.
- Configure AMap domain restrictions, quota alerts, and separate Keys for separate deployments.
- Rotate the Key and `securityJsCode` if a dashboard or browser session is exposed to an unauthorized party.
- Tooltip values are inserted as text rather than HTML.
- Coordinates outside valid latitude and longitude ranges are ignored.

### Known limitations

- Server-side storage and AMap `serviceHost` proxy mode are not yet implemented.
- Changing AMap credentials after the SDK has loaded requires reloading the Grafana page.
- Multiple AMap credentials on the same Grafana page are not supported.
- World map and multilingual-map permissions are not exposed as panel options.
- This unsigned beta release cannot be installed on Grafana Cloud.

### Development

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

### License

Apache-2.0

Apache-2.0 applies only to the Ageomap source code. Use of AMap services is subject to the applicable AMap terms and requires your own credentials.

---

## 中文

> [!WARNING]
> Ageomap 0.1.0 使用高德地图的浏览器端明文认证模式。高德 Key 和 `securityJsCode` 会保存在 dashboard JSON 中，能够查看或导出 dashboard 的用户可能读取这些值。本 Beta 版本仅适合启用了身份认证、用户可信的自托管 Grafana。请勿用于匿名访问或公开分享的 dashboard。

### 项目简介

Ageomap 是一个 Beta 阶段的 Grafana 面板插件，使用 **AMap（高德地图）Web JS API 2.0** 矢量地图展示地理数据。它直接运行在 Grafana 面板中，无需 iframe、外部页面或自行维护地图瓦片服务。

### 功能

- 使用高德地图 Web JS API 2.0 原生矢量渲染。
- 根据查询 `refId` 配置轨迹（折线）和圆形标点。
- 在浏览器中进行可选的 WGS-84 到 GCJ-02 转换。
- 使用准确字段名或正则表达式匹配经纬度字段。
- 可分别配置颜色、透明度、半径、线宽、层级和纯文本悬浮提示。
- 自动跟随 Grafana 明暗主题。
- 可分别设置浅色、深色和固定主题的高德地图样式。
- 支持工具条、比例尺和自动缩放到数据范围。

### 为什么不在 Grafana Geomap 中使用高德 XYZ 瓦片

Grafana Geomap 可以显示包括高德栅格瓦片在内的 XYZ 地址，但 Ageomap 使用官方高德 Web JS API：

| Geomap 中的高德 XYZ 瓦片 | Ageomap |
| --- | --- |
| 固定缩放级别的栅格图片 | 高德 2.0 原生矢量渲染，支持平滑、连续缩放 |
| 带标注的 256 px 瓦片在高分辨率屏幕上可能模糊 | 由高德矢量引擎渲染清晰的标注、道路和 POI |
| 单一瓦片样式无法跟随 Grafana 明暗主题 | 可分别配置浅色和深色样式并自动跟随 Grafana |
| 需要在其他环节转换 WGS-84 坐标 | 面板内置可选的坐标转换 |
| 通常依赖未公开的瓦片地址格式 | 使用官方高德 Web JS API |
| OpenLayers 独立绘制覆盖物 | 轨迹、标点和悬浮信息使用高德原生对象 |

Ageomap 专用于高德地图。如果需要其他底图提供商、Geohash、查询图层、热力图或更丰富的通用图层类型，Grafana Geomap 仍然是更合适的选择。

### 侧载未签名插件

未签名插件只能侧载到自行托管的 Grafana OSS 或 Grafana Enterprise。Grafana Cloud 不支持未签名插件。

#### 从发布包安装

下载发布压缩包并解压到 Grafana 插件目录。最终路径中应直接包含 `plugin.json`：

```text
/var/lib/grafana/plugins/lizy14-ageomap-panel/plugin.json
```

#### 从源码构建

```bash
npm install
npm run build
sudo mkdir -p /var/lib/grafana/plugins/lizy14-ageomap-panel
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

#### 允许加载未签名插件

通过软件包或系统服务安装 Grafana 时，在 `grafana.ini` 中加入：

```ini
[plugins]
allow_loading_unsigned_plugins = lizy14-ageomap-panel
```

使用 Docker 或 Docker Compose 时：

```yaml
environment:
  - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=lizy14-ageomap-panel
volumes:
  - /path/to/ageomap/dist:/var/lib/grafana/plugins/lizy14-ageomap-panel:ro
```

允许多个未签名插件时，请使用逗号分隔插件 ID。安装或更新后重启 Grafana：

```bash
sudo systemctl restart grafana-server
# 或者
docker compose restart grafana
```

Grafana 会在服务端日志中记录未签名插件警告，这是侧载时的预期行为。

### 配置高德地图

1. 在 <https://console.amap.com/dev/key/app> 创建高德地图 **Web 端（JS API）Key** 和 `securityJsCode`。
2. 将 Key 严格限制到承载 Grafana 的域名。
3. 添加 **Ageomap** 可视化，在面板选项中填写 Key 和 `securityJsCode`。
4. 编写返回经纬度字段的查询。
5. 将每个查询的 `refId` 配置为 `route`、`marker` 或 `none`。

示例：

```json
{
  "A": { "kind": "route" },
  "B": {
    "kind": "marker",
    "color": "#C4162A",
    "labelFields": "name,value",
    "labelSuffix": " kWh"
  }
}
```

### 安全和隐私

- 本 Beta 版本将高德 Key 和 `securityJsCode` 作为普通面板选项保存，Grafana 不会对其加密。
- 能够查看或导出 dashboard 的用户可能读取这些值。
- 不要将包含凭据的 dashboard 提交到 Git，也不要发布为 Grafana snapshot。
- 禁用匿名访问，并将 dashboard 访问权限限制给可信用户。
- 配置高德域名限制和配额告警，不同部署使用不同 Key。
- 如果 dashboard 或浏览器会话被未授权人员获取，应立即轮换 Key 和 `securityJsCode`。
- 悬浮提示内容只作为文本插入，不会作为 HTML 执行。
- 超出有效经纬度范围的坐标会被忽略。

### 已知限制

- 尚未实现服务端安全存储和高德 `serviceHost` 代理模式。
- SDK 加载后如需更换高德凭据，必须重新加载 Grafana 页面。
- 同一个 Grafana 页面不支持使用多组不同的高德凭据。
- 尚未将世界地图和多语言地图权限暴露为面板选项。
- Grafana Cloud 无法安装这个未签名 Beta 版本。

### 开发

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

### 许可证

Apache-2.0

Apache-2.0 仅适用于 Ageomap 源代码。使用高德地图服务时，您仍须遵守适用的高德条款并使用自己的凭据。
