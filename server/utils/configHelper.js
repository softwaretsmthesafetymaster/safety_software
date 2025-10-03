import moduleConfigs from '../config/moduleConfigs.js';

class ConfigHelper {
  static initializeCompanyConfig(data) {
    const defaultConfig = {};

    for (const moduleName in moduleConfigs) {
      defaultConfig[moduleName] = {
        ...moduleConfigs[moduleName].default
      };
    }

    // Merge with provided request data (like name, logo, industry)
    return {
      ...data,
      config: {
        ...defaultConfig,
        ...data.config // in case user sends custom config
      }
    };
  }
}

export default ConfigHelper;
