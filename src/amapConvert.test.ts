import { convertGpsCoordinates } from './amapConvert';

function convertedLocation([lon, lat]: [number, number]) {
  return {
    getLng: () => lon + 0.01,
    getLat: () => lat + 0.02,
  };
}

describe('convertGpsCoordinates', () => {
  test('uses the official GPS conversion in batches of 40', async () => {
    const convertFrom = jest.fn((coordinates, type, callback) => {
      callback('complete', { info: 'ok', locations: coordinates.map(convertedLocation) });
    });
    const coordinates = Array.from({ length: 41 }, (_, index): [number, number] => [116 + index / 100, 39]);
    const onBatch = jest.fn();

    const converted = await convertGpsCoordinates({ convertFrom }, coordinates, () => true, onBatch);

    expect(convertFrom).toHaveBeenCalledTimes(2);
    expect(convertFrom.mock.calls[0][0]).toHaveLength(40);
    expect(convertFrom.mock.calls[1][0]).toHaveLength(1);
    expect(convertFrom.mock.calls[0][1]).toBe('gps');
    expect(converted).toHaveLength(41);
    expect(converted[0]).toEqual([116.01, 39.02]);
    expect(onBatch.mock.calls.map((call) => call[1])).toEqual([40, 41]);
  });

  test('returns without calling AMap when there are no coordinates', async () => {
    const convertFrom = jest.fn();

    await expect(convertGpsCoordinates({ convertFrom }, [])).resolves.toEqual([]);
    expect(convertFrom).not.toHaveBeenCalled();
  });

  test('rejects failed conversions', async () => {
    const convertFrom = jest.fn((_coordinates, _type, callback) => {
      callback('error', { info: 'SERVICE_NOT_AVAILABLE' });
    });

    await expect(convertGpsCoordinates({ convertFrom }, [[116, 39]])).rejects.toThrow(
      'AMap coordinate conversion failed (error)'
    );
  });

  test('rejects malformed conversion results', async () => {
    const convertFrom = jest.fn((_coordinates, _type, callback) => {
      callback('complete', { info: 'ok', locations: [] });
    });

    await expect(convertGpsCoordinates({ convertFrom }, [[116, 39]])).rejects.toThrow(
      'unexpected number of coordinates'
    );
  });

  test('stops submitting batches after newer data supersedes the conversion', async () => {
    let current = true;
    const convertFrom = jest.fn((coordinates, _type, callback) => {
      current = false;
      callback('complete', { info: 'ok', locations: coordinates.map(convertedLocation) });
    });
    const coordinates = Array.from({ length: 41 }, (_, index): [number, number] => [116 + index / 100, 39]);

    await expect(convertGpsCoordinates({ convertFrom }, coordinates, () => current)).rejects.toThrow(
      'superseded by newer data'
    );
    expect(convertFrom).toHaveBeenCalledTimes(1);
  });

  test('rejects conversions that do not complete within 15 seconds', async () => {
    jest.useFakeTimers();
    try {
      const convertFrom = jest.fn();
      const conversion = convertGpsCoordinates({ convertFrom }, [[116, 39]]);
      const expectation = expect(conversion).rejects.toThrow('timed out (15s)');

      await jest.advanceTimersByTimeAsync(15000);
      await expectation;
    } finally {
      jest.useRealTimers();
    }
  });
});
