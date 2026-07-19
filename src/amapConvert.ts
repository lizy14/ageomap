export type Coordinate = [number, number];

export const GPS_CONVERSION_BATCH_SIZE = 40;
const GPS_CONVERSION_TIMEOUT_MS = 15000;

function coordinateFromAMap(location: any): Coordinate {
  const lon = typeof location?.getLng === 'function' ? location.getLng() : location?.lng;
  const lat = typeof location?.getLat === 'function' ? location.getLat() : location?.lat;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error('AMap coordinate conversion returned an invalid coordinate');
  }
  return [lon, lat];
}

function convertBatch(AMap: any, coordinates: Coordinate[]): Promise<Coordinate[]> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('AMap coordinate conversion timed out (15s)'));
      }
    }, GPS_CONVERSION_TIMEOUT_MS);
    const finish = (callback: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        callback();
      }
    };

    try {
      AMap.convertFrom(coordinates, 'gps', (status: string, result: any) => {
        if (status !== 'complete' || result?.info !== 'ok' || !Array.isArray(result.locations)) {
          finish(() => reject(new Error(`AMap coordinate conversion failed (${status || 'unknown status'})`)));
          return;
        }
        if (result.locations.length !== coordinates.length) {
          finish(() => reject(new Error('AMap coordinate conversion returned an unexpected number of coordinates')));
          return;
        }
        try {
          const converted = result.locations.map(coordinateFromAMap);
          finish(() => resolve(converted));
        } catch (error) {
          finish(() => reject(error));
        }
      });
    } catch (error) {
      finish(() => reject(error));
    }
  });
}

export async function convertGpsCoordinates(
  AMap: any,
  coordinates: Coordinate[],
  isCurrent: () => boolean = () => true,
  onBatch?: (batch: Coordinate[], convertedCount: number) => void
): Promise<Coordinate[]> {
  const converted: Coordinate[] = [];
  for (let offset = 0; offset < coordinates.length; offset += GPS_CONVERSION_BATCH_SIZE) {
    if (!isCurrent()) {
      throw new Error('AMap coordinate conversion was superseded by newer data');
    }
    const batch = coordinates.slice(offset, offset + GPS_CONVERSION_BATCH_SIZE);
    const convertedBatch = await convertBatch(AMap, batch);
    if (!isCurrent()) {
      throw new Error('AMap coordinate conversion was superseded by newer data');
    }
    converted.push(...convertedBatch);
    onBatch?.(convertedBatch, converted.length);
  }
  return converted;
}
