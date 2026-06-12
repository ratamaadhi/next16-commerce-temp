export interface Address {
  documentId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  subdistrictId: string;
}

export interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  subdistrictId: string;
}

export interface AddressListResponse {
  data: Address[];
}
