import { wgs84ToGcj02 } from './coord';

describe('wgs84ToGcj02', () => {
  test('leaves coordinates outside China unchanged', () => {
    expect(wgs84ToGcj02(40.7128, -74.006)).toEqual([-74.006, 40.7128]);
  });

  test('converts coordinates inside China', () => {
    const [lon, lat] = wgs84ToGcj02(39.909, 116.397);
    expect(lon).toBeCloseTo(116.40324, 4);
    expect(lat).toBeCloseTo(39.9104, 4);
  });
});
