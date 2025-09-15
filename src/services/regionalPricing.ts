/**
 * Regional Pricing Service
 * 
 * Handles regional pricing and currency conversion
 */

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  currencySymbol: string;
  features: string[];
  billing: 'monthly' | 'yearly';
}

export interface RegionalPricing {
  monthly: {
    price: number;
    currency: string;
    symbol: string;
    formatted: string;
  };
  yearly: {
    price: number;
    currency: string;
    symbol: string;
    formatted: string;
  };
  savings: {
    amount: number;
    percentage: number;
    formatted: string;
  };
}

class RegionalPricingService {
  private basePrices = {
    monthly: 7.99, // £7.99
    yearly: 59.99  // £59.99
  };

  private currencyRates: Record<string, number> = {
    'GBP': 1.0,      // Base currency (British Pound)
    'USD': 1.27,     // US Dollar
    'EUR': 1.17,     // Euro
    'CAD': 1.72,     // Canadian Dollar
    'AUD': 1.92,     // Australian Dollar
    'JPY': 187.0,    // Japanese Yen
    'CHF': 1.10,     // Swiss Franc
    'SEK': 13.2,     // Swedish Krona
    'NOK': 13.8,     // Norwegian Krone
    'DKK': 8.7,      // Danish Krone
    'PLN': 5.1,      // Polish Zloty
    'CZK': 29.2,     // Czech Koruna
    'HUF': 460.0,    // Hungarian Forint
    'RON': 5.8,      // Romanian Leu
    'BGN': 2.3,      // Bulgarian Lev
    'HRK': 8.7,      // Croatian Kuna
    'RUB': 115.0,    // Russian Ruble
    'TRY': 41.0,     // Turkish Lira
    'BRL': 6.4,      // Brazilian Real
    'MXN': 21.5,     // Mexican Peso
    'INR': 105.0,    // Indian Rupee
    'CNY': 9.1,      // Chinese Yuan
    'KRW': 1700.0,   // South Korean Won
    'SGD': 1.71,     // Singapore Dollar
    'HKD': 9.9,      // Hong Kong Dollar
    'NZD': 2.08,     // New Zealand Dollar
    'ZAR': 23.5,     // South African Rand
    'ILS': 4.7,      // Israeli Shekel
    'AED': 4.7,      // UAE Dirham
    'SAR': 4.8,      // Saudi Riyal
  };

  private currencySymbols: Record<string, string> = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'BGN': 'лв',
    'HRK': 'kn',
    'RUB': '₽',
    'TRY': '₺',
    'BRL': 'R$',
    'MXN': '$',
    'INR': '₹',
    'CNY': '¥',
    'KRW': '₩',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'ZAR': 'R',
    'ILS': '₪',
    'AED': 'د.إ',
    'SAR': '﷼',
  };

  /**
   * Detect user's region and currency
   */
  public detectUserRegion(): string {
    // Try to detect from browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-GB';
    const region = locale.split('-')[1] || 'GB';
    
    // Map common regions to currencies
    const regionToCurrency: Record<string, string> = {
      'GB': 'GBP',
      'US': 'USD',
      'CA': 'CAD',
      'AU': 'AUD',
      'NZ': 'NZD',
      'DE': 'EUR',
      'FR': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'NL': 'EUR',
      'BE': 'EUR',
      'AT': 'EUR',
      'FI': 'EUR',
      'IE': 'EUR',
      'PT': 'EUR',
      'GR': 'EUR',
      'LU': 'EUR',
      'MT': 'EUR',
      'CY': 'EUR',
      'SK': 'EUR',
      'SI': 'EUR',
      'EE': 'EUR',
      'LV': 'EUR',
      'LT': 'EUR',
      'SE': 'SEK',
      'NO': 'NOK',
      'DK': 'DKK',
      'PL': 'PLN',
      'CZ': 'CZK',
      'HU': 'HUF',
      'RO': 'RON',
      'BG': 'BGN',
      'HR': 'HRK',
      'RU': 'RUB',
      'TR': 'TRY',
      'BR': 'BRL',
      'MX': 'MXN',
      'IN': 'INR',
      'CN': 'CNY',
      'KR': 'KRW',
      'SG': 'SGD',
      'HK': 'HKD',
      'ZA': 'ZAR',
      'IL': 'ILS',
      'AE': 'AED',
      'SA': 'SAR',
    };

    return regionToCurrency[region] || 'GBP';
  }

  /**
   * Get pricing for a specific currency
   */
  public getPricingForCurrency(currency: string = 'GBP'): RegionalPricing {
    const rate = this.currencyRates[currency] || 1.0;
    const symbol = this.currencySymbols[currency] || '£';

    const monthlyPrice = this.basePrices.monthly * rate;
    const yearlyPrice = this.basePrices.yearly * rate;
    
    // Calculate savings
    const monthlyYearlyEquivalent = monthlyPrice * 12;
    const savings = monthlyYearlyEquivalent - yearlyPrice;
    const savingsPercentage = Math.round((savings / monthlyYearlyEquivalent) * 100);

    return {
      monthly: {
        price: monthlyPrice,
        currency,
        symbol,
        formatted: this.formatPrice(monthlyPrice, currency, symbol)
      },
      yearly: {
        price: yearlyPrice,
        currency,
        symbol,
        formatted: this.formatPrice(yearlyPrice, currency, symbol)
      },
      savings: {
        amount: savings,
        percentage: savingsPercentage,
        formatted: this.formatPrice(savings, currency, symbol)
      }
    };
  }

  /**
   * Format price based on currency
   */
  private formatPrice(price: number, currency: string, symbol: string): string {
    // Round to appropriate decimal places
    const roundedPrice = Math.round(price * 100) / 100;
    
    // Handle different currency formatting
    switch (currency) {
      case 'JPY':
      case 'KRW':
        // No decimal places for these currencies
        return `${symbol}${Math.round(roundedPrice).toLocaleString()}`;
      case 'INR':
        // Indian numbering system
        return `${symbol}${roundedPrice.toLocaleString('en-IN')}`;
      default:
        // Standard formatting with 2 decimal places
        return `${symbol}${roundedPrice.toFixed(2)}`;
    }
  }

  /**
   * Get plan details for a specific currency and billing period
   */
  public getPlanDetails(currency: string = 'GBP', billing: 'monthly' | 'yearly' = 'monthly') {
    const pricing = this.getPricingForCurrency(currency);
    const isYearly = billing === 'yearly';
    
    return {
      name: 'Premium Plan',
      price: isYearly ? pricing.yearly.formatted : pricing.monthly.formatted,
      priceId: isYearly ? 'price_yearly' : 'price_monthly',
      features: [
        'Unlimited AI conversations',
        'Save highlights and progress',
        'Cross-device synchronization',
        'Premium audio features',
        'Advanced reading analytics',
        'Priority support'
      ],
      billing: billing,
      currency: currency,
      savings: isYearly ? pricing.savings : null
    };
  }

  /**
   * Get all available pricing options
   */
  public getAllPricingOptions(): Record<string, RegionalPricing> {
    const options: Record<string, RegionalPricing> = {};
    
    for (const currency of Object.keys(this.currencyRates)) {
      options[currency] = this.getPricingForCurrency(currency);
    }
    
    return options;
  }
}

// Export singleton instance
export const regionalPricingService = new RegionalPricingService();
export default regionalPricingService;
