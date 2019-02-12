type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type ChildType<T> = T extends Array<infer U>
  ? U
  : T extends Record<any, infer V>
  ? V
  : unknown;

export type ChildKeyType<T> = T extends Array<infer U>
  ? number
  : T extends Record<infer K, infer V>
  ? K
  : string;

type AddToEmptyTuple<T extends PropertyKeyTuple, TNew extends PropertyKey> = T extends []
  ? [TNew]
  : never;
type AddToOneTuple<T extends PropertyKeyTuple, TNew extends PropertyKey> = T extends [infer U]
  ? U extends PropertyKey
    ? [U, TNew]
    : never
  : never;
type AddToTwoTuple<T extends PropertyKeyTuple, TNew extends PropertyKey> = T extends [
  infer U,
  infer V
]
  ? U extends PropertyKey
    ? [U, V, TNew]
    : never
  : never;
type AddToThreeTuple<T extends PropertyKeyTuple, TNew extends PropertyKey> = T extends [
  infer U,
  infer V,
  infer W
]
  ? U extends PropertyKey
    ? [U, V, W, TNew]
    : never
  : never;
type AddToMoreTuple<T extends PropertyKeyTuple> = T extends [
  infer U,
  infer V,
  infer W,
  infer X,
  ...PropertyKey[]
]
  ? U extends PropertyKey
    ? [U, V, W, X, ...PropertyKey[]]
    : never
  : never;

export type PropertyKeyTuple = [...PropertyKey[]];

export type AddToTuple<T extends PropertyKeyTuple, TLast> = TLast extends PropertyKey
  ? (T extends []
      ? AddToEmptyTuple<T, TLast>
      : T extends [PropertyKey]
      ? AddToOneTuple<T, TLast>
      : T extends [PropertyKey, PropertyKey]
      ? AddToTwoTuple<T, TLast>
      : T extends [PropertyKey, PropertyKey, PropertyKey]
      ? AddToThreeTuple<T, TLast>
      : AddToMoreTuple<T>)
  : never;
