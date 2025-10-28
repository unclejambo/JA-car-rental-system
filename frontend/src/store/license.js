import axios from 'axios';
import { getApiBase } from '../utils/api.js';

const getLicenseUrl = () => `${getApiBase()}/api/driver-license`;

export const updateLicense = async (licenseNo, data) => {
  const url = `${getLicenseUrl()}/${licenseNo}`;
  const response = await axios.put(url, data);
  return response.data;
};

export const createLicenseForCustomer = async (customerId, data) => {
  const url = `${getLicenseUrl()}/customer/${customerId}`;
  const response = await axios.post(url, data);
  return response.data;
};
