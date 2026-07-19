import { PanelPlugin } from '@grafana/data';
import { AMapOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

const styleOptions = [
  { value: 'normal', label: '标准' },
  { value: 'dark', label: '幻影黑' },
  { value: 'light', label: '月光银' },
  { value: 'whitesmoke', label: '远山黛' },
  { value: 'fresh', label: '草色青' },
  { value: 'grey', label: '雅士灰' },
  { value: 'graffiti', label: '涂鸦' },
  { value: 'macaron', label: '马卡龙' },
  { value: 'blue', label: '靛青蓝' },
  { value: 'darkblue', label: '极夜蓝' },
  { value: 'wine', label: '酱籽' },
];

export const plugin = new PanelPlugin<AMapOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    // --- 高德凭据 ---
    .addTextInput({
      path: 'amapKey',
      name: '高德 Key',
      description: '高德开放平台 Web端(JS API) Key。会保存在 dashboard JSON 中并发送到浏览器。',
      category: ['高德凭据'],
      defaultValue: '',
    })
    .addTextInput({
      path: 'amapSecurity',
      name: '安全密钥 securityJsCode',
      description: '2021.12 之后申请的 Key 必填。当前版本会保存在 dashboard JSON 中，仅适合可信的私有 Grafana。',
      category: ['高德凭据'],
      defaultValue: '',
    })
    // --- 地图样式 ---
    .addRadio({
      path: 'themeMode',
      name: '主题模式',
      description: '跟随 = 随 Grafana 明暗主题自动切换深浅地图;固定 = 始终用指定样式',
      category: ['地图样式'],
      defaultValue: 'follow',
      settings: {
        options: [
          { value: 'follow', label: '跟随 Grafana' },
          { value: 'fixed', label: '固定' },
        ],
      },
    })
    .addSelect({
      path: 'lightMapStyle',
      name: '浅色主题地图样式',
      category: ['地图样式'],
      defaultValue: 'normal',
      settings: { options: styleOptions },
      showIf: (c) => c.themeMode !== 'fixed',
    })
    .addSelect({
      path: 'darkMapStyle',
      name: '深色主题地图样式',
      category: ['地图样式'],
      defaultValue: 'dark',
      settings: { options: styleOptions },
      showIf: (c) => c.themeMode !== 'fixed',
    })
    .addSelect({
      path: 'mapStyle',
      name: '固定地图样式',
      category: ['地图样式'],
      defaultValue: 'normal',
      settings: { options: styleOptions },
      showIf: (c) => c.themeMode === 'fixed',
    })
    // --- 数据映射 ---
    .addSelect({
      path: 'coordSystem',
      name: '数据坐标系',
      description: '数据源经纬度的坐标系。WGS84 会通过高德官方 API 转成 GCJ-02。',
      category: ['数据映射'],
      defaultValue: 'wgs84',
      settings: {
        options: [
          { value: 'wgs84', label: 'WGS-84 (GPS原始, 高德官方转换)' },
          { value: 'gcj02', label: 'GCJ-02 (已是高德坐标)' },
        ],
      },
    })
    .addTextInput({
      path: 'latField',
      name: '纬度字段 (正则)',
      category: ['数据映射'],
      defaultValue: 'lat',
    })
    .addTextInput({
      path: 'lonField',
      name: '经度字段 (正则)',
      category: ['数据映射'],
      defaultValue: '(lon|lng)',
    })
    .addTextInput({
      path: 'seriesConfig',
      name: '按 refId 配置 (JSON)',
      description:
        '每个查询(refId)如何画。例: {"A":{"kind":"route"},"B":{"kind":"marker","color":"#C4162A","labelFields":"loc_nm,chg_total"}} — kind 可为 route/marker/none',
      category: ['数据映射'],
      defaultValue: '{"A":{"kind":"route"}}',
      settings: { useTextarea: true, rows: 5 },
    })
    // --- 视图 ---
    .addBooleanSwitch({ path: 'autoFit', name: '自动缩放到数据范围', category: ['视图'], defaultValue: true })
    .addNumberInput({ path: 'defaultZoom', name: '默认缩放级别', category: ['视图'], defaultValue: 11 })
    .addBooleanSwitch({ path: 'showToolbar', name: '显示工具条', category: ['视图'], defaultValue: false })
    .addBooleanSwitch({ path: 'showScale', name: '显示比例尺', category: ['视图'], defaultValue: false })
    // --- 轨迹默认样式 ---
    .addColorPicker({ path: 'routeColor', name: '轨迹颜色', category: ['轨迹样式'], defaultValue: '#1F60C4' })
    .addNumberInput({ path: 'routeWidth', name: '轨迹宽度', category: ['轨迹样式'], defaultValue: 4 })
    .addSliderInput({ path: 'routeOpacity', name: '轨迹透明度', category: ['轨迹样式'], defaultValue: 0.6, settings: { min: 0, max: 1, step: 0.05 } })
    // --- 标点默认样式 ---
    .addColorPicker({ path: 'markerColor', name: '标点颜色', category: ['标点样式'], defaultValue: '#C4162A' })
    .addNumberInput({ path: 'markerRadius', name: '标点半径', category: ['标点样式'], defaultValue: 5 })
    .addSliderInput({ path: 'markerOpacity', name: '标点透明度', category: ['标点样式'], defaultValue: 0.8, settings: { min: 0, max: 1, step: 0.05 } });
});
