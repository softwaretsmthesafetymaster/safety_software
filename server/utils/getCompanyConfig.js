// utils/getCompanyConfig.js
import companyConfigs from '../config/companyConfig.js';

const getCompanyConfig = (companyKey = 'default') => {
  const key = companyKey.toLowerCase();
  return companyConfigs[key] || companyConfigs.default;
};

export default getCompanyConfig;
