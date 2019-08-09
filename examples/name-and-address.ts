import { getRootPath } from '../dist/index';

interface INameAndAddress {
  givenName: string;
  familyName?: string;
  phoneNumber: string | null;
  emails: string[];
  primaryAddressId: number;
  addresses: Array<{
    id: number;
    addressLines: string[];
    town: string;
    postcode: number;
  }>;
}

const root = getRootPath<INameAndAddress>();

const givenNameP = root.getSubPath(x => x.givenName);
const familyNameP = root.getSubPath(x => x.familyName);
const phoneP = root.getSubPath(x => x.phoneNumber);
const emailT = root.getSubPath(x => x.emails).getDynamicChild();
const primaryAddressIdP = root.getSubPath(x => x.primaryAddressId);
const addressesP = root.getSubPath(x => x.addresses);
const addressT = addressesP.getDynamicChild();
const addrIdT = addressT.getSubPathTemplate(x => x.id);
const addrLinesT = addressT.getSubPathTemplate(x => x.addressLines);
const firstAddressLinesExplicitT = root.getSubPath(x => x.addresses[0].addressLines);
const addrLineT = addrLinesT.getDynamicChild();
const townT = addressT.getSubPathTemplate(x => x.town);
const postcodeT = addressT.getSubPathTemplate(x => x.postcode);

const data: INameAndAddress = {
  givenName: 'joe',
  phoneNumber: null,
  emails: ['joe-home@example.com'],
  primaryAddressId: 1,
  addresses: [
    {
      id: 1,
      addressLines: ['101 Street Road'],
      town: 'Somewhere',
      postcode: 12345,
    },
  ],
};

// givenName: string
// Reason: Field can only be a string and has no nullable/optional parent objects
const givenName = givenNameP.getValue(data);

// familyName: string | undefined
// Reason: Field is optional
const familyName = familyNameP.getValue(data);

// phone: string | null
// Reason: Field is nullable, but has no optional parent objects (so can't be undefined)
const phone = phoneP.getValue(data);

// firstEmail: string | undefined
// Reason: Field can only be a string, but entry may not exist in the array
const firstEmail = emailT.getPath([0]).getValue(data);

// secondEmail: string | undefined
// Reason: Field can only be a string, but entry may not exist in the array
const secondEmail = emailT.getPath([1]).getValue(data);

// primaryAddrId: number
// Reason: Field can only be a number
const primaryAddrId = primaryAddressIdP.getValue(data);

// primaryAddr: { id?: number, ... } | undefined
// Reason: Field returns an array type, but `find` may or may not find the relevant record.
// Array contents are make Partial, as subpaths may initialise them with other fields undefined.
// `getValueUnsafe` can be used to explictly avoid this.
const primaryAddr = addressesP.getValue(data).find(a => a.id === primaryAddrId);

// firstAddressSecondLine: string | undefined
// Reason: Field can only be a string, but the address may not exist, or the line in the address may not exist
const firstAddressSecondLineP = addrLineT.getPath([0, 1]);
const firstAddressSecondLine = firstAddressSecondLineP.getValue(data);

// firstAddressPostcode: number | undefined
// Reason: Field can only be a number, but the address may not exist
const firstAddressPostcode = firstAddressSecondLineP.getRelatedPath(postcodeT).getValue(data);

// firstAddressLines: string[] | undefined
// Reason: Field is a string[], but the address may not exist
const firstAddressLines = firstAddressLinesExplicitT.getValue(data);
