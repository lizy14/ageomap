export interface TimeOrderedPoint {
  rowIndex: number;
  timestamp?: number;
}

export interface ConversionSeries<T extends TimeOrderedPoint> {
  kind: 'route' | 'marker';
  points: T[];
}

export interface ProgressiveConversionPlan<T extends TimeOrderedPoint> {
  previewPriority: T[];
  conversionQueue: T[];
}

export function sampleEvenly<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) {
    return [...items];
  }
  if (limit <= 1) {
    return items.length ? [items[items.length - 1]] : [];
  }

  const sampled: T[] = [];
  for (let index = 0; index < limit; index++) {
    const itemIndex = Math.round((index * (items.length - 1)) / (limit - 1));
    sampled.push(items[itemIndex]);
  }
  return sampled;
}

export function newestFirst<T extends TimeOrderedPoint>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftHasTime = Number.isFinite(left.timestamp);
    const rightHasTime = Number.isFinite(right.timestamp);
    if (leftHasTime && rightHasTime) {
      return right.timestamp! - left.timestamp!;
    }
    if (leftHasTime !== rightHasTime) {
      return leftHasTime ? -1 : 1;
    }
    return right.rowIndex - left.rowIndex;
  });
}

export function uniqueInOrder<T extends object>(items: T[]): T[] {
  return [...new Set(items)];
}

export function buildProgressiveConversionPlan<T extends TimeOrderedPoint>(
  series: Array<ConversionSeries<T>>,
  batchSize: number
): ProgressiveConversionPlan<T> {
  const markerPriority = series.filter((item) => item.kind === 'marker').flatMap((item) => newestFirst(item.points));
  const routes = series.filter((item) => item.kind === 'route');
  const routeSamples = routes.flatMap((item) => sampleEvenly(item.points, batchSize));
  const newestRoutePoints = routes.flatMap((item) => newestFirst(item.points).slice(0, batchSize));
  const remainingRoutePoints = routes.flatMap((item) => newestFirst(item.points));
  const previewPriority = uniqueInOrder([...markerPriority, ...routeSamples]);
  const conversionQueue = uniqueInOrder([...previewPriority, ...newestRoutePoints, ...remainingRoutePoints]);
  return { previewPriority, conversionQueue };
}
