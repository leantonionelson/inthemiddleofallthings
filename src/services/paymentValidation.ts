/**
 * Payment Validation Service
 * 
 * Ensures users cannot bypass payment requirements and handles
 * account reversion for users who attempt to skip payment.
 */

export interface PaymentValidationResult {
  isValid: boolean;
  isFreeUser: boolean;
  hasActiveSubscription: boolean;
  requiresPayment: boolean;
  reason?: string;
}

class PaymentValidationService {
  /**
   * Validate if user has completed required payment
   */
  public async validatePaymentStatus(): Promise<PaymentValidationResult> {
    try {
      // Check if user is in free mode
      const isFreeMode = localStorage.getItem('freeAuth') === 'true';
      const isFreeUser = isFreeMode;
      
      if (isFreeUser) {
        return {
          isValid: true,
          isFreeUser: true,
          hasActiveSubscription: false,
          requiresPayment: false,
          reason: 'Free user - no payment required'
        };
      }
      
      // Check subscription status from localStorage
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      const hasActiveSubscription = subscriptionData ? JSON.parse(subscriptionData).isActive === true : false;
      
      if (!hasActiveSubscription) {
        // Check if user somehow bypassed payment
        const userType = localStorage.getItem('userType');
        if (userType === 'authenticated') {
          // User claims to be authenticated but has no subscription
          console.warn('User bypassed payment - reverting to free account');
          await this.revertToFreeAccount(currentUser.uid);
          
          return {
            isValid: false,
            isFreeUser: true,
            hasActiveSubscription: false,
            requiresPayment: false,
            reason: 'Account reverted to free due to payment bypass'
          };
        }
        
        return {
          isValid: false,
          isFreeUser: false,
          hasActiveSubscription: false,
          requiresPayment: true,
          reason: 'No active subscription found'
        };
      }
      
      return {
        isValid: true,
        isFreeUser: false,
        hasActiveSubscription: true,
        requiresPayment: false,
        reason: 'Valid subscription found'
      };
      
    } catch (error) {
      console.error('Error validating payment status:', error);
      return {
        isValid: false,
        isFreeUser: false,
        hasActiveSubscription: false,
        requiresPayment: true,
        reason: 'Error validating payment status'
      };
    }
  }
  
  /**
   * Revert user account to free status
   */
  public async revertToFreeAccount(userId: string): Promise<void> {
    try {
      // Update local storage
      localStorage.setItem('subscriptionStatus', JSON.stringify({
        isActive: false,
        status: 'incomplete',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'Free Plan'
      }));
      localStorage.setItem('userType', 'free');
      localStorage.setItem('paymentBypassDetected', 'true');
      
      console.log('User account reverted to free due to payment bypass attempt');
    } catch (error) {
      console.error('Error reverting account to free:', error);
    }
  }
  
  /**
   * Check if user has bypassed payment
   */
  public hasBypassedPayment(): boolean {
    return localStorage.getItem('paymentBypassDetected') === 'true';
  }
  
  /**
   * Clear payment bypass flag
   */
  public clearBypassFlag(): void {
    localStorage.removeItem('paymentBypassDetected');
  }
  
  /**
   * Enforce payment requirement for premium features
   */
  public async enforcePaymentRequirement(): Promise<boolean> {
    const validation = await this.validatePaymentStatus();
    
    if (!validation.isValid && validation.requiresPayment) {
      // Redirect to payment or show upgrade prompt
      console.warn('Payment required for this feature');
      return false;
    }
    
    return true;
  }
  
  /**
   * Get user capabilities based on payment status
   */
  public async getUserCapabilities() {
    const validation = await this.validatePaymentStatus();
    
    return {
      canUseAI: validation.hasActiveSubscription,
      canSaveProgress: true, // All users can save progress
      canSaveHighlights: true, // All users can save highlights
      canSync: validation.hasActiveSubscription,
      hasActiveSubscription: validation.hasActiveSubscription,
      isFreeUser: validation.isFreeUser,
      requiresUpgrade: validation.requiresPayment
    };
  }
}

// Export singleton instance
export const paymentValidationService = new PaymentValidationService();
export default paymentValidationService;
