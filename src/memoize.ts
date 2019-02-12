export function memoizeOne<TFn extends (...args: any[]) => any>(fn: TFn): TFn {
  let lastArgs: any[] | undefined;
  let lastResult: ReturnType<TFn>;

  return ((...args: any[]) => {
    if (!arraysShallowEqual(args, lastArgs)) {
      lastResult = fn(...args);
      lastArgs = args;
    }
    return lastResult;
  }) as TFn;
}

export function memoizeAll<TFn extends (...args: any[]) => any>(fn: TFn): TFn {
  const cache: Array<{ args: any[]; result: ReturnType<TFn> }> = [];

  return ((...args: any[]) => {
    let cacheItem = cache.find(i => arraysShallowEqual(args, i.args));
    if (!cacheItem) {
      cacheItem = { args, result: fn(...args) };
      cache.push(cacheItem);
    }
    return cacheItem.result;
  }) as TFn;
}

function arraysShallowEqual(array1: any[], array2: any[] | undefined) {
  return (
    !!array2 &&
    array1.length === array2.length &&
    array1.every((value, index) => value === array2[index])
  );
}
