import { getRootPath } from './Path';

interface ITestType {
  a:
    | undefined
    | {
        b?: {
          c: number;
        };
        d?: string;
        e: Array<{
          f: string;
        }>;
        g?: Array<string>;
        h: Array<{
          i: Array<number>;
        }>;
        j: string | null | undefined;
      };
}

function getTestObject(): ITestType {
  return { a: { b: { c: 5 }, e: [{ f: 'hi' }, { f: 'bye' }], h: [{ i: [1, 2, 3] }], j: null } };
}

const root = getRootPath<ITestType>();

describe('Path.getValue', () => {
  it('gets the root path', () => {
    const testObject = getTestObject();
    const value = root.getValue(testObject);

    expect(value).toBe(testObject);
  });

  it('gets a non-existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.d);
    const value = path.getValue(testObject);

    expect(value).toBeUndefined();
  });

  it('gets an existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.b.c);
    const value = path.getValue(testObject);

    expect(value).toBe(5);
  });

  it('gets an existing static array path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[0]);
    const value = path.getValue(testObject);

    expect(value).toEqual({ f: 'hi' });
  });

  it('gets an existing static array subPath', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[1].f);
    const value = path.getValue(testObject);

    expect(value).toBe('bye');
  });

  it('gets a existing null value', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.j);
    const value = path.getValue(testObject);

    expect(value).toBeNull();
  });
});

describe('Path.setValue', () => {
  it('throws when setting the root path', () => {
    const testObject = getTestObject();
    expect(() => root.setValue(testObject, { a: undefined })).toThrowError();
  });

  it('sets a non-existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.d);
    path.setValue(testObject, 'newValue');

    expect(testObject.a && testObject.a.d).toBe('newValue');
  });

  it('updates an existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.b.c);
    path.setValue(testObject, 9);

    expect(testObject.a && testObject.a.b && testObject.a.b.c).toBe(9);
  });

  it('updates an existing static array path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[0]);
    path.setValue(testObject, { f: 'hello' });

    expect(testObject.a && testObject.a.e && testObject.a.e[0]).toEqual({ f: 'hello' });
  });

  it('updates an existing static array subPath', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[1].f);
    path.setValue(testObject, 'goodbye');

    expect(testObject.a && testObject.a.e && testObject.a.e[1] && testObject.a.e[1].f).toBe(
      'goodbye'
    );
  });
});

describe('Path.removeValue', () => {
  it('throws when removing the root path', () => {
    const testObject = getTestObject();
    expect(() => root.removeValue(testObject)).toThrowError();
  });

  it('ignores when removing a non-existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.d);
    path.removeValue(testObject);

    expect(testObject.a && testObject.a.d).toBeUndefined();
  });

  it('removes an existing static path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.b.c);
    path.removeValue(testObject);

    expect(testObject.a && testObject.a.b && testObject.a.b.c).toBeUndefined();
  });

  it('removes an existing static array path', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[0]);
    path.removeValue(testObject);

    expect(testObject.a && testObject.a.e && testObject.a.e.length).toBe(1);
    expect(testObject.a && testObject.a.e && testObject.a.e[0]).toEqual({ f: 'bye' });
  });

  it('removes an existing static array subPath', () => {
    const testObject = getTestObject();
    const path = root.getSubPath(x => x.a.e[1].f);
    path.removeValue(testObject);

    expect(
      testObject.a && testObject.a.e && testObject.a.e[1] && testObject.a.e[1].f
    ).toBeUndefined();
  });
});

describe('Path.getDynamicChildTemplate', () => {
  it('gets a dynamic array path value', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const path = template.getPath([1]);
    const value = path.getValue(testObject);

    expect(value).toEqual({ f: 'bye' });
  });

  it('gets a dynamic array sub-path value', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const subTemplate = template.getSubPathTemplate(x => x.f);
    const path = subTemplate.getPath([1]);
    const value = path.getValue(testObject);

    expect(value).toEqual('bye');
  });

  it('gets a dynamic object path value', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a).getDynamicChild();
    const path = template.getPath(['b']);
    const value = path.getValue(testObject);

    expect(value).toEqual({ c: 5 });
  });

  it('gets multiple item dynamic path value', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.h).getDynamicChild();
    const subTemplate = template.getSubPathTemplate(x => x.i).getDynamicChild();
    const path = subTemplate.getPath([0, 2]);
    const value = path.getValue(testObject);

    expect(value).toEqual(3);
  });

  it('sets a non-existing dynamic array subPath', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const subTemplate = template.getSubPathTemplate(x => x.f);
    const path = subTemplate.getPath([2]);
    path.setValue(testObject, 'good luck');

    expect(testObject.a && testObject.a.e && testObject.a.e[2] && testObject.a.e[2].f).toBe(
      'good luck'
    );
  });

  it('updates an existing dynamic array subPath', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const subTemplate = template.getSubPathTemplate(x => x.f);
    const path = subTemplate.getPath([1]);
    path.setValue(testObject, 'goodbye');

    expect(testObject.a && testObject.a.e && testObject.a.e[1] && testObject.a.e[1].f).toBe(
      'goodbye'
    );
  });

  it('sets a non-existing dynamic array subPath with non-existant array', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.g).getDynamicChild();
    const path = template.getPath([0]);
    path.setValue(testObject, 'green');

    expect(testObject.a && testObject.a.g && testObject.a.g[0]).toBe('green');
    expect(Array.isArray(testObject.a && testObject.a.g)).toBe(true);
  });

  it('removes an existing dynamic array path', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const path = template.getPath([0]);
    path.removeValue(testObject);

    expect(testObject.a && testObject.a.e && testObject.a.e.length).toBe(1);
    expect(testObject.a && testObject.a.e && testObject.a.e[0]).toEqual({ f: 'bye' });
  });
});

describe('PathTemplate.enumerateAllPaths', () => {
  it('returns no paths for an undefined array value', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.g).getDynamicChild();
    const paths = template.enumerateAllPaths(testObject);

    expect(paths).toHaveLength(0);
  });

  it('returns all paths that exist for an array', () => {
    const testObject = getTestObject();
    const template = root.getSubPath(x => x.a.e).getDynamicChild();
    const paths = template.enumerateAllPaths(testObject);

    expect(paths).toHaveLength(2);
    expect(paths[0].toString()).toBe('a.e[0]');
    expect(paths[1].toString()).toBe('a.e[1]');
  });

  it('returns all sub-paths that exist for an array', () => {
    const testObject = getTestObject();
    const template = root
      .getSubPath(x => x.a.e)
      .getDynamicChild()
      .getSubPathTemplate(x => x.f);
    const paths = template.enumerateAllPaths(testObject);

    expect(paths).toHaveLength(2);
    expect(paths[0].toString()).toBe('a.e[0].f');
    expect(paths[1].toString()).toBe('a.e[1].f');
  });
});

describe('Singletons', () => {
  it('returns the different instance for the same path using different root instances', () => {
    const path1 = root.getSubPath(x => x.a.d);
    const path2 = getRootPath<ITestType>().getSubPath(x => x.a.d);
    expect(path1).not.toBe(path2);
  });

  it('returns the same instance for the same path', () => {
    const path1 = root.getSubPath(x => x.a.d);
    const path2 = root.getSubPath(x => x.a.d);
    expect(path1).toBe(path2);
  });

  it('returns the same instance for the same path built in two parts', () => {
    const path1 = root.getSubPath(x => x.a).getSubPath(x => x.d);
    const path2 = root.getSubPath(x => x.a.d);
    expect(path1).toBe(path2);
  });

  it('returns the same instance for the same path template', () => {
    const template1 = root.getSubPath(x => x.a.g).getDynamicChild();
    const template2 = root.getSubPath(x => x.a.g).getDynamicChild();
    expect(template1).toBe(template2);
  });

  it('returns the same instance for the same path built in two parts', () => {
    const template1 = root
      .getSubPath(x => x.a)
      .getSubPath(x => x.d)
      .getDynamicChild();
    const template2 = root.getSubPath(x => x.a.d).getDynamicChild();
    expect(template1).toBe(template2);
  });

  it('returns the same instance for a path build directly vs one built via a template', () => {
    const template = root.getSubPath(x => x.a.g).getDynamicChild();
    const path1 = template.getPath([2]);
    const path2 = root.getSubPath(x => x.a.g[2]);
    expect(path1).toBe(path2);
  });
});
