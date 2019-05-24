import { memoizeAll, memoizeOne } from './memoize';
import {
  NonFunctionProperties,
  AddToTuple,
  PropertyKeyTuple,
  ChildKeyType,
  ChildType,
} from './typeUtils';

type PathParts = ReadonlyArray<PropertyKey>;

const GET_KEY = Symbol('PATHPARTSBUILDER_GET_KEY');

type PathPartsBuilder<T> = {
  [K in keyof NonFunctionProperties<Required<NonNullable<T>>>]: PathPartsBuilder<NonNullable<T>[K]>
} & {
  [GET_KEY]: () => PathParts;
};

function getPathPartsBuilder<T>(path: PathTemplateParts = []): PathPartsBuilder<T> {
  return new Proxy(
    {},
    {
      get(target: object, name: string | symbol) {
        if (name === GET_KEY) {
          return () => path;
        }

        // integer indexers come through as string
        const checkedName =
          typeof name !== 'symbol' && name.length && !Number.isNaN(+name) ? +name : name;

        return getPathPartsBuilder([...path, checkedName]);
      },
    }
  ) as PathPartsBuilder<T>;
}

// -------------------------------------------------

type PathBuilder<TRoot> = <TValue>(...parts: PropertyKey[]) => IPath<TRoot, TValue>;

type TemplateBuilder<TRoot> = <TDynParts extends PropertyKeyTuple, TValue>(
  addDynamicPart: boolean,
  ...parts: PathTemplatePart[]
) => IPathTemplate<TRoot, TDynParts, TValue>;

/**
 * Creates a new Path instance pointing to the root of the supplied generic type.
 */
export function getRootPath<TRoot>(): IPath<TRoot, TRoot> {
  const templateBuilder: TemplateBuilder<TRoot> = memoizeAll<TemplateBuilder<TRoot>>(
    (addDynamicPart, ...parts) =>
      new PathTemplate(addDynamicPart, parts, pathBuilder, templateBuilder)
  );
  const pathBuilder: PathBuilder<TRoot> = memoizeAll<PathBuilder<TRoot>>(
    (...parts) => new Path(parts, pathBuilder, templateBuilder)
  );
  return pathBuilder();
}

class Path<TRoot, TValue> {
  constructor(
    private readonly _parts: PathParts,
    private readonly _pathBuilder: PathBuilder<TRoot>,
    private readonly _templateBuilder: TemplateBuilder<TRoot>
  ) {}

  /**
   * Returns if this is the root path.
   */
  get isRoot() {
    return !this._parts.length;
  }

  /**
   * Returns the ordered object index keys of the path.
   */
  get parts() {
    return this._parts;
  }

  /**
   * Returns a string representation of the path.
   * Note that any symbols in the path are shown as `Symbol(<symbol name if defined>)`.
   */
  readonly toString = memoizeOne(() => {
    return pathPartsToString(this._parts, []);
  });

  /**
   * Gets the value in the supplied object at this path.
   */
  readonly getValue = (source: TRoot): TValue | undefined => {
    return getValueAtPath<TValue>(source, this._parts);
  };

  /**
   * Sets the value of the supplied object at this path.
   * Note: Passing `undefined` as the new value will explicitly set the path's value to `undefined`.
   *  To remove the path altogether, use the `removeValue` function.
   */
  readonly setValue = (source: TRoot, value: TValue | undefined) => {
    if (this.isRoot) {
      throw new Error('Cannot set value for the root path');
    }
    setValueAtPath(source, this._parts, value);
  };

  /**
   * Removes this path from the supplied object.
   */
  readonly removeValue = (source: TRoot) => {
    if (this.isRoot) {
      throw new Error('Cannot remove value for the root path');
    }
    removeValueAtPath(source, this._parts);
  };

  /**
   * Returns a Path instance for a path below this Path.
   */
  readonly getSubPath = <TSubValue>(
    builder: (partsBuilder: PathPartsBuilder<TValue>) => PathPartsBuilder<TSubValue>
  ): IPath<TRoot, TSubValue> => {
    const built = builder(getPathPartsBuilder<TValue>(this._parts));
    const parts = built[GET_KEY]();
    return this._pathBuilder(...parts);
  };

  /**
   * Returns a Path Template for creating paths one level below this Path.
   */
  readonly getDynamicChild = () => {
    return this._templateBuilder<AddToTuple<[], ChildKeyType<TValue>>, ChildType<TValue>>(
      true,
      ...this._parts
    );
  };

  /**
   * Supplies the dynamic parts for the specified Path Template from this Path instance,
   * rather than having to list them explicitly.
   * This can be useful for creating a parent Path from this Path.
   * If the supplied Path Template has dynamic parts that are not in the current Path, an exception will be thrown.
   */
  readonly getRelatedPath = <TRelValue>(
    template: IPathTemplate<TRoot, any, TRelValue>
  ): IPath<TRoot, TRelValue> => {
    return template.getPath(template.getDynamicPartsFromPath(this));
  };
}

export interface IPath<TRoot, TValue> extends Path<TRoot, TValue> {}

function getValueAtPath<TValue = any>(source: any, path: PathParts): TValue | undefined {
  return path.reduce(
    (parent, p) =>
      parent === null ||
      parent === undefined ||
      (Array.isArray(parent) && typeof p === 'number' && parent.length <= p)
        ? undefined
        : parent[p],
    source
  );
}

function setValueAtPath(source: any, path: PathParts, value: any): void {
  if (!path || !path.length) {
    return;
  }

  const ps = [...path];
  const [lastPath] = ps.splice(-1, 1);

  const lowestObj = ps.reduce((acc, p, idx) => {
    if (!acc[p]) {
      // If the next path part is an integer, then assume this part is an array
      const nextPartIsInt = Number.isInteger(Number(path[idx + 1]));
      acc[p] = nextPartIsInt ? [] : {};
    }
    return acc[p];
  }, source);

  lowestObj[lastPath] = value;
}

function removeValueAtPath(source: any, path: PathParts): void {
  if (!path || !path.length) {
    throw new Error('A path to remove at must be provided');
  }

  if (!source) {
    return;
  }

  const ps = [...path];
  const [lastPath] = ps.splice(-1, 1);
  let found = true;

  const lowestObj = ps.reduce((acc, p) => {
    if (!found || !acc[p]) {
      found = false;
      return acc;
    }
    return acc[p];
  }, source);

  if (found) {
    if (typeof lastPath !== 'symbol' && typeof lastPath !== 'string' && Array.isArray(lowestObj)) {
      lowestObj.splice(lastPath, 1);
    } else {
      delete lowestObj[lastPath];
    }
  }
}

// -------------------------------------------------

type DynamicPathPart = object;
type PathTemplatePart = PropertyKey | DynamicPathPart;
type PathTemplateParts = ReadonlyArray<PathTemplatePart>;

const DYNAMIC_PART: DynamicPathPart = {};

function isDynamicPathPart(value: PathTemplatePart): value is DynamicPathPart {
  return value === DYNAMIC_PART || typeof value === 'object';
}

class PathTemplate<TRoot, TDynamicParts extends PropertyKeyTuple, TValue> {
  private readonly _parts: PathTemplateParts;

  constructor(
    addDynamicPart: boolean,
    parts: PathTemplateParts,
    private readonly _pathBuilder: PathBuilder<TRoot>,
    private readonly _templateBuilder: TemplateBuilder<TRoot>
  ) {
    this._parts = addDynamicPart ? parts.concat([DYNAMIC_PART]) : parts;
  }

  /**
   * Returns a string representation of the Path Template.
   * Note that any symbols in the path template are shown as `Symbol(<symbol name if defined>)`.
   */
  readonly toString = memoizeOne(() => {
    return pathPartsToString(this._parts, []);
  });

  /**
   * Returns a Path from this Path Template, using the supplied dynamic parts.
   */
  readonly getPath = (dynamicParts: TDynamicParts): IPath<TRoot, TValue> => {
    const templateParts = this._parts;
    const revParts = [...dynamicParts].reverse();

    function getNextDynamicPart() {
      const part = revParts.pop();
      if (part === undefined) {
        const pathDescription = pathPartsToString(templateParts, dynamicParts);
        throw new Error(`Dynamic part for template '${pathDescription}' cannot be found`);
      }
      return part;
    }

    const parts = this._parts.map(p => (isDynamicPathPart(p) ? getNextDynamicPart() : p));
    return this._pathBuilder(...parts);
  };

  /**
   * Extracts the dynamic parts, defined in this Path Template, from the supplied Path.
   */
  readonly getDynamicPartsFromPath = <TOtherValue>(
    path: IPath<TRoot, TOtherValue>
  ): TDynamicParts => {
    if (path.parts.length < this._parts.length) {
      throw new Error(
        `Provided Path (${path.toString()}) cannot be a parent path of Template (${this.toString()})`
      );
    }

    return this._parts.reduce<PropertyKeyTuple>((acc, p, i) => {
      if (isDynamicPathPart(p)) {
        return [...acc, path.parts[i]];
      }
      if (p !== path.parts[i]) {
        throw new Error(
          `Provided Path (${path.toString()}) does not match Template (${this.toString()})`
        );
      }
      return acc;
    }, []) as TDynamicParts;
  };

  /**
   * Returns a Path Template instance for a path below this Path Template.
   */
  readonly getSubPathTemplate = <TSubValue>(
    builder: (partsBuilder: PathPartsBuilder<TValue>) => PathPartsBuilder<TSubValue>
  ): IPathTemplate<TRoot, TDynamicParts, TSubValue> => {
    const built = builder(getPathPartsBuilder<TValue>(this._parts));
    const parts = built[GET_KEY]();
    return this._templateBuilder(false, ...parts);
  };

  readonly getDynamicChild = () => {
    return this._templateBuilder<
      AddToTuple<TDynamicParts, ChildKeyType<TValue>>,
      ChildType<TValue>
    >(true, ...this._parts);
  };

  /**
   * Derives all Paths for this Path Template that exist in the supplied value.
   */
  readonly enumerateAllPaths = (value: TRoot): Array<Path<TRoot, TValue>> => {
    return enumerate(value, this._parts).map(ps => this._pathBuilder(...ps));
  };
}

export interface IPathTemplate<TRoot, TDynParts extends Array<PropertyKey>, TValue>
  extends PathTemplate<TRoot, TDynParts, TValue> {}

function pathPartsToString(pathParts: PathTemplateParts, dynamicParts: PropertyKeyTuple): string {
  const revDynParts = [...dynamicParts].reverse();
  return pathParts
    .map((p, i) => {
      if (isDynamicPathPart(p)) {
        const key = revDynParts.pop();
        return `[${key === undefined ? '?' : key.toString()}]`;
      } else if (typeof p === 'number') {
        return `[${p}]`;
      } else {
        return i === 0 ? `${p.toString()}` : `.${p.toString()}`;
      }
    })
    .join('');
}

function enumerate(value: any, path: PathTemplateParts): PathParts[] {
  if (!path.length) {
    return [[]];
  }

  const [part, ...rest] = path;

  function enumerateKey(key: PropertyKey) {
    const subPaths = rest.length ? enumerate(value && value[key], rest) : [[]];
    return subPaths.map(ps => [key, ...ps]);
  }

  if (!isDynamicPathPart(part)) {
    return enumerateKey(part);
  }

  const keys: PropertyKey[] = Array.isArray(value)
    ? new Array(value.length).fill(null).map((_, i) => i)
    : value
    ? Object.getOwnPropertyNames(value)
    : [];

  return keys.map(enumerateKey).reduce((acc, a) => [...acc, ...a], []);
}
