export type Undefinable = 'undefinable';

export type NullishToUndefinable<T> = T extends undefined | null ? Undefinable : never;
export type ArrayToUndefinable<T> = T extends Array<infer U> ? Undefinable : never;
export type UndefinableToUndefined<T extends Undefinable> = T extends Undefinable
  ? undefined
  : never;

export type ApplyDeepPartial<T extends Undefinable, TValue> = T extends Undefinable
  ? DeepPartial<TValue>
  : never;

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type DeepPartial<T> = T extends Array<infer S>
  ? Array<
      { [P in keyof S]?: S[P] extends Array<infer U> ? Array<DeepPartial<U>> : DeepPartial<S[P]> }
    >
  : { [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>> : DeepPartial<T[P]> };

export type ChildType<T> = T extends Array<infer U>
  ? U
  : T extends Record<any, infer V>
  ? V
  : T extends undefined | null
  ? never
  : unknown;

export type ChildKeyType<T> = T extends Array<infer U>
  ? number
  : T extends Record<infer K, infer V>
  ? K
  : T extends Object
  ? string
  : never;

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

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y
  ? 1
  : 2)
  ? A
  : B;

export type Readonlyness = 'readonly' | 'writable';

export type IsReadonly<T, K extends keyof T> = IfEquals<
  { [Q in K]: T[K] },
  { -readonly [Q in K]: T[K] },
  'writable',
  'readonly'
>;
