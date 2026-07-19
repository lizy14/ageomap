import { test, expect } from '@grafana/plugin-e2e';

test('shows a hint when the AMap key is not configured', async ({ panelEditPage, page }) => {
  await panelEditPage.setVisualization('Ageomap');
  await expect(page.getByText('Ageomap: 请在面板选项里填写高德 Key 和 securityJsCode')).toBeVisible();
});
