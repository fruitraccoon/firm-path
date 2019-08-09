# firm-path

_Typed access to deep object fields via paths, built using TypeScript._

[![npm](https://img.shields.io/npm/v/firm-path.svg)](https://www.npmjs.com/package/firm-path)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/firm-path.svg?style=flat)](https://bundlephobia.com/result?p=firm-path)

This package provides a way to create strongly-typed access to object fields. Paths can be created directly, or can be created from templates using specific values (such as an array index) when required.

Path roots also cache/memoize the paths and templates that are created under them, so path instances are singletons that can be compared using `===` or used as keys elsewhere if desired.

**To try `firm-path` in an interactive example, [you can use this stackblitz](https://stackblitz.com/edit/typescript-6cgvmk) that contains the example below.**

## Installation

NPM: `npm install firm-path --save`

Yarn: `yarn install firm-path`

## Example Usage

To use `firm-path`, first import the `getRootPath` function.

```js
import { getRootPath } from 'firm-path';
```

In order to strongly type access to objects, first create or derive a type that describes their shape.

```js
interface IAddress {
  lines: string[];
  postcode: number;
}
```

Then obtain an instance to the root path for the type. The root path is used as a starting point to build sub-paths.

```js
const rootPath = getRootPath<IAddress>();
```

Paths are built using an arrow function, so that typescript can provide intellisense for the available fields. Note that any functions defined in the type are explicitly excluded.

```js
// An example of a simple field path
const postcodePath = rootPath.getSubPath(a => a.postcode);

// Paths can point to primitives or more complex objects
const linesPath = rootPath.getSubPath(a => a.lines);

// Paths can build sub-paths, and indexing can be used
const firstLinePath = linesPath.getSubPath(ls => ls[0]);
```

"Templates" can be derived to defer having to specify some parts of a path until later.

```js
const lineTemplate = linesPath.getDynamicChild();
```

Create or derive an instance of the object to be interrogated. A path can be used to get the object value.

```js
const address = {
  lines: ['101 Somewhere St', 'Smalltown'],
  postcode: 12345,
};

// postcode value is number 123456 (typed as `number`)
const postcode = postcodePath.getValue(address);

// firstLine value is string '101 Somewhere St' (typed as string | undefined)
const firstLine = firstLinePath.getValue(address);

// The argument to getPath is a typed tuple
// secondLine value is string 'Smalltown'
const secondLinePath = lineTemplate.getPath([1]);
const secondLine = secondLinePath.getValue(address);

// thirdLine value is undefined
const thirdLinePath = lineTemplate.getPath([2]);
const thirdLine = secondLinePath.getValue(address);
```

Paths can also be used to set or remove the particular value.

```js
// address.postcode is now 98765
postcodePath.setValue(address, 98765);

// address.lines is now ['101 Somewhere St']
secondLinePath.removeValue(address);
```

The key values for a Path can be retrieved if desired.

```js
// secondLinePathParts value is ["lines", 1]
const secondLinePathParts = secondLinePath.parts;
```

## Features

- Access to the object values is strongly typed by TypeScript.
- Paths and Templates are immutable.
- Paths and Template instances are cached within the Root Path instance, and thus can be compared using `===`.
- Paths and Templates can contain Symbols
- Templates can contain multiple dynamic parts (eg: arrays of arrays)
- Updating an object (via `setValue` or `removeValue`) mutates the provided object. If you would prefer not to mutate the original instance, consider wrapping the call using [`immer`](https://github.com/mweststrate/immer).

## Why would I use this?

- Until JavaScript/TypeScript gets [Optional Chaining](https://github.com/tc39/proposal-optional-chaining), deep object getting and setting can be performed without having to do falsey checks at each level.

- Using Paths would usually be useful when wanting to genericise some behaviour. For example, a function could retrieve, check, then update a value in a supplied object, with a Path to define which field to operate on.  For example:

  ```js
  interface IItem {
    value: number;
    subItem: { subValue: number; };
  }

  function addOne(obj: IItem, path: IPath<IItem, number>) {
    const value = path.getValue(obj);
    const newValue = value === undefined ? 0 : value + 1;
    path.setValue(obj, newValue);
  }

  const root = getRootPath<IItem>();
  const valuePath = root.getSubPath(i => i.value);
  const subValuePath = root.getSubPath(i => i.subItem.subValue);

  const testObj = { value: 1, subItem: { subValue: 10 } };

  addOne(testObj, valuePath);
  addOne(testObj, subValuePath);
  ```
