// Phone number formatting utilities

export class PhoneFormatter {
  // Format phone number for display: +91XXXXXXXXXX -> +91 XXXXX XXXXX
  static formatForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it's in +91 format
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      const countryCode = cleaned.substring(0, 3); // +91
      const firstPart = cleaned.substring(3, 8); // First 5 digits
      const secondPart = cleaned.substring(8, 13); // Last 5 digits
      
      return `${countryCode} ${firstPart} ${secondPart}`;
    }
    
    return phoneNumber; // Return as-is if not in expected format
  }

  // Format phone number for input display: +91XXXXXXXXXX -> +91 XXXXX XXXXX
  static formatForInput(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      if (cleaned.startsWith('91')) {
        cleaned = '+' + cleaned;
      } else if (/^\d/.test(cleaned)) {
        cleaned = '+91' + cleaned;
      }
    }
    
    // Limit to +91 + 10 digits
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  }

  // Validate phone number format
  static isValid(phoneNumber: string): boolean {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Get just the 10-digit number without country code
  static getDigitsOnly(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // If it starts with 91, remove it to get the 10-digit number
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    }
    
    // If it's already 10 digits, return as-is
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  }
}
