// Import stylesheets
import { getRootPath } from '../dist/index';

// An interface to describe the object to be used
interface IAddress {
  lines: string[];
  postcode: number;
}

// -- Building Paths and Templates ----------
// The root path is used as a starting point to build sub-paths
const rootPath = getRootPath<IAddress>();

// An example of a simple field path
const postcodePath = rootPath.getSubPath(a => a.postcode);

// Paths can point to primitives or more complex objects
const linesPath = rootPath.getSubPath(a => a.lines);

// Indexing can be used to obtain sub-paths
const firstLinePath = linesPath.getSubPath(ls => ls[0]);

// "Path Templates" can be built to allow particular path parts to be specified later
const lineTemplate = linesPath.getDynamicChild();

// -- Using Paths and Templates ----------
const address = {
  lines: ['101 Somewhere St', 'Smalltown'],
  postcode: 12345,
};

// postcode value is number 123456 (typed as `number`)
const postcode = postcodePath.getValue(address);

const lines = linesPath.getValue(address);

// firstLine value is string '101 Somewhere St' (typed as string | undefined)
const firstLine = firstLinePath.getValue(address);

// The argument to getPath is a typed tuple
// secondLine value is string 'Smalltown'
const secondLinePath = lineTemplate.getPath([1]);
const secondLine = secondLinePath.getValue(address);

// thirdLine value is undefined
const thirdLinePath = lineTemplate.getPath([2]);
const thirdLine = thirdLinePath.getValue(address);

// address.postcode is now 98765
postcodePath.setValue(address, 98765);

// address.lines is now ['101 Somewhere St']
secondLinePath.removeValue(address);

// secondLinePathParts value is ["lines", 1]
const secondLinePathParts = secondLinePath.parts;
