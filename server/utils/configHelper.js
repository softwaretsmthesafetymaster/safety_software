import moduleConfigs from '../config/moduleConfigs.js';

class ConfigHelper {
  static initializeCompanyConfig(data) {
    const moduleDefaults = {};
    const roleSet = new Set();

    // Loop through defined modules to build config
    for (const moduleName in moduleConfigs) {
      const moduleConfig = moduleConfigs[moduleName].default || {};

      moduleDefaults[moduleName] = moduleConfig;

      // Extract roles from module configs
      if (Array.isArray(moduleConfig.roles)) {
        moduleConfig.roles.forEach(role => roleSet.add(role));
      }
    }

    return {
      ...data,
      config: {
        modules: moduleDefaults,
        roles: Array.from(roleSet),

        // Optional overrides remain intact if user sends them
        ui: data.config?.ui || {},
        security: data.config?.security || {}
      }
    };
  }
}

export default ConfigHelper;
