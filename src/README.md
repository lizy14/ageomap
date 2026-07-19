# Ageomap

在 Grafana 面板中直接使用高德地图 Web JS API 2.0 矢量地图展示轨迹和标点。

![Ageomap 展示模拟轨迹数据](https://raw.githubusercontent.com/lizy14/ageomap/main/src/img/screenshot.jpg)

> [!WARNING]
> Ageomap 0.1.0 会把高德 Key 和 `securityJsCode` 保存在 dashboard JSON 中。当前 Beta
> 版本仅适合启用了身份认证、用户可信的自托管 Grafana。

- 高德原生矢量地图、轨迹和圆形标点
- 可选 WGS-84 到 GCJ-02 浏览器端转换
- 按查询 `refId` 配置样式和纯文本悬浮提示
- 自动跟随 Grafana 明暗主题

[中文文档](https://github.com/lizy14/ageomap#readme) ·
[English documentation](https://github.com/lizy14/ageomap/blob/main/README.en.md) ·
[安装与配置](https://github.com/lizy14/ageomap/blob/main/docs/setup.md) ·
[使用指南](https://github.com/lizy14/ageomap/blob/main/docs/usage.md) ·
[设计与安全](https://github.com/lizy14/ageomap/blob/main/docs/design.md)

本项目主要由 GitHub Copilot 设计和实现，由人类维护者负责产品方向、关键决策和审查。

---

Ageomap renders routes and markers on AMap (Gaode / 高德地图) Web JS API 2.0 vector maps directly
inside a Grafana panel.

> [!WARNING]
> Ageomap 0.1.0 stores the AMap Key and `securityJsCode` in dashboard JSON. This beta release is
> intended only for authenticated, trusted, self-hosted Grafana instances.

The project was primarily designed and implemented by GitHub Copilot, under the product direction,
decisions, and review of its human maintainer.

Source code is licensed under Apache-2.0. Ageomap is an independent third-party project and is not
affiliated with, endorsed, or sponsored by Grafana Labs, AMap, 高德地图, or their affiliates.
