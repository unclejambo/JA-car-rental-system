import axios from 'axios';
import { getApiBase } from '../utils/api.js';

const getLicenseUrl = () => `${getApiBase()}/driver-license`;

export const updateLicense = async (licenseNo, data) => {
  const url = `${getLicenseUrl()}/${licenseNo}`;
  const response = await axios.put(url, data);
  return response.data;
};
