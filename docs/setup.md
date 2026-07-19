# 安装与配置

**简体中文** | [English](setup.en.md) | [项目首页](../README.md) | [使用指南](usage.md) | [设计与安全](design.md)

## 环境要求

- 自托管 Grafana OSS 或 Grafana Enterprise `12.3.0` 或更高版本
- 安装了 Node.js 22 的构建环境（仅从源码构建时需要）
- 高德开放平台 Web 端（JS API）Key 和 `securityJsCode`

Grafana Cloud 不支持侧载未签名插件。

## 安装插件

插件 ID 是 `lizy14-ageomap-panel`。无论使用发布包还是从源码构建，最终插件目录中都
必须直接包含 `plugin.json`：

```text
/var/lib/grafana/plugins/lizy14-ageomap-panel/plugin.json
```

### 使用发布包

从 [GitHub Releases](https://github.com/lizy14/ageomap/releases) 下载发布压缩包，
解压后把 `lizy14-ageomap-panel` 目录放入 Grafana 插件目录。

### 从源码构建

```bash
npm install
npm run build
sudo mkdir -p /var/lib/grafana/plugins/lizy14-ageomap-panel
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

仓库的 `.nvmrc` 指定 Node.js 22，`package.json` 指定 npm 11。

## 允许加载未签名插件

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

允许多个未签名插件时，使用逗号分隔插件 ID。安装或更新后重启 Grafana：

```bash
sudo systemctl restart grafana-server
# 或者
docker compose restart grafana
```

Grafana 服务端日志会记录未签名插件警告，这是侧载时的预期行为。

## 配置高德凭据

1. 在[高德开放平台](https://console.amap.com/dev/key/app)创建 **Web 端（JS API）Key**
   和 `securityJsCode`。
2. 把 Key 严格限制到承载 Grafana 的域名，并配置合适的配额告警。
3. 在 Grafana 中添加 **Ageomap** 可视化。
4. 在面板选项的“高德凭据”中填写 Key 和 `securityJsCode`。
5. 按[使用指南](usage.md)配置经纬度字段和查询 `refId`。

> [!CAUTION]
> 当前版本把这两个值作为普通面板选项保存在 dashboard JSON 中，Grafana 不会加密
> 它们。能够查看或导出 dashboard 的用户可能读取这些值。

请禁用匿名访问，把 dashboard 权限限制给可信用户，不要提交包含凭据的 dashboard，
也不要把它发布为 Grafana snapshot。不同部署应使用不同 Key；如果 dashboard 或浏览器
会话泄露，应轮换 Key 和 `securityJsCode`。详细边界见[设计与安全](design.md#安全与隐私)。

SDK 加载后如需更换凭据，必须重新加载整个 Grafana 页面。同一 Grafana 页面不能同时
使用多组不同的高德凭据。

## 更新

使用发布包时，以新版本的完整插件目录替换旧目录。源码安装时重新运行：

```bash
npm install
npm run build
sudo cp -a dist/. /var/lib/grafana/plugins/lizy14-ageomap-panel/
```

然后重启 Grafana。请勿把新旧构建产物混合复制。

## 本地开发

安装依赖并运行现有检查：

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

开发服务器使用 Docker Compose：

```bash
npm run server
```

端到端测试需要 Docker 和 Playwright 浏览器：

```bash
npm run e2e
```

仓库内的开发 Compose 配置会允许加载 `lizy14-ageomap-panel`，并挂载测试 dashboard
和 TestData DB 数据源。

## 常见问题

### Grafana 找不到插件

确认插件路径中直接包含 `plugin.json`，配置的未签名插件 ID 完全等于
`lizy14-ageomap-panel`，然后重启 Grafana。

### 面板提示缺少高德凭据

Key 和 `securityJsCode` 都是当前版本的必填项。确认填写在当前面板的“高德凭据”中。

### SDK 加载失败或超时

检查 Key 类型、`securityJsCode`、域名白名单、网络访问和高德配额。切换凭据后重新
加载 Grafana 页面。
