import Company from '../models/Company.js';

class NumberGenerator {
  static async generateNumber(companyId, module) {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const config = company.config?.numbering?.[module] || {};
      const prefix = config.prefix || this.getDefaultPrefix(module);
      const format = config.format || this.getDefaultFormat(module);
      
      const date = new Date();
      let number = format;

      // Replace format placeholders
      number = number.replace('YY', date.getFullYear().toString().substr(-2));
      number = number.replace('YYYY', date.getFullYear().toString());
      number = number.replace('MM', String(date.getMonth() + 1).padStart(2, '0'));
      number = number.replace('DD', String(date.getDate()).padStart(2, '0'));
      
      // Add random/sequential number
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      number = number.replace('XXX', randomPart);
      number = number.replace('XX', randomPart.substr(0, 2));

      number = `${prefix}${number}`;
      return number;
    } catch (error) {
      console.error('Error generating number:', error);
      return this.getFallbackNumber(module);
    }
  }

  static getDefaultPrefix(module) {
    const prefixes = {
      ptw: 'PTW',
      ims: 'INC',
      hazop: 'HAZ',
      hira: 'HIRA',
      bbs: 'BBS',
      audit: 'AUD'
    };
    return prefixes[module] || 'DOC';
  }

  static getDefaultFormat(module) {
    const formats = {
      ptw: 'YYMMXXX',
      ims: 'YYMMDDXX',
      hazop: 'YYMMXXX',
      hira: 'YYMMXXX',
      bbs: 'YYMMDDXX',
      audit: 'YYMMXXX'
    };
    return formats[module] || 'YYMMXXX';
  }

  static getFallbackNumber(module) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${this.getDefaultPrefix(module)}${year}${month}${random}`;
  }
}

export default NumberGenerator;