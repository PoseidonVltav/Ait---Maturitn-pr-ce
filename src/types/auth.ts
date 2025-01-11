export type UserType = 'business' | 'user';

export interface RegistrationStep1Data {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

export type SubscriptionPlan = 'one_month' | 'six_months' | 'one_year';