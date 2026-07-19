import { buildProgressiveConversionPlan, newestFirst, sampleEvenly, uniqueInOrder } from './conversionPlan';

describe('sampleEvenly', () => {
  test('keeps the first and last points in an evenly distributed sample', () => {
    expect(sampleEvenly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).toEqual([0, 3, 6, 9]);
  });

  test('returns every point when the route already fits the limit', () => {
    expect(sampleEvenly([0, 1, 2], 4)).toEqual([0, 1, 2]);
  });
});

describe('newestFirst', () => {
  test('uses the time field when available', () => {
    const points = [
      { rowIndex: 0, timestamp: 300 },
      { rowIndex: 1, timestamp: 100 },
      { rowIndex: 2, timestamp: 200 },
    ];

    expect(newestFirst(points).map((point) => point.rowIndex)).toEqual([0, 2, 1]);
  });

  test('falls back to later row indexes when there is no usable time field', () => {
    const points = [{ rowIndex: 0 }, { rowIndex: 1 }, { rowIndex: 2 }];

    expect(newestFirst(points).map((point) => point.rowIndex)).toEqual([2, 1, 0]);
  });

  test('places rows without a usable timestamp after time-ordered rows', () => {
    const points = [{ rowIndex: 2 }, { rowIndex: 1, timestamp: -100 }, { rowIndex: 0, timestamp: 100 }];

    expect(newestFirst(points).map((point) => point.rowIndex)).toEqual([0, 1, 2]);
  });
});

test('uniqueInOrder removes repeated point references without changing priority', () => {
  const first = { rowIndex: 0 };
  const second = { rowIndex: 1 };

  expect(uniqueInOrder([first, second, first])).toEqual([first, second]);
});

test('progressive conversion prioritizes markers, a route preview, and then the newest route points', () => {
  const markers = [
    { rowIndex: 0, timestamp: 100 },
    { rowIndex: 1, timestamp: 200 },
  ];
  const route = Array.from({ length: 100 }, (_, rowIndex) => ({ rowIndex, timestamp: rowIndex }));

  const plan = buildProgressiveConversionPlan(
    [
      { kind: 'route', points: route },
      { kind: 'marker', points: markers },
    ],
    40
  );

  expect(plan.conversionQueue.slice(0, 2)).toEqual([markers[1], markers[0]]);
  expect(plan.previewPriority).toHaveLength(42);
  expect(plan.previewPriority).toContain(route[0]);
  expect(plan.previewPriority).toContain(route[99]);
  expect(plan.conversionQueue[42]).toBe(route[98]);
  expect(plan.conversionQueue).toHaveLength(102);
});
