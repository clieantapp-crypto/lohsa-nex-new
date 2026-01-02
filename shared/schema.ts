import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insuranceApplications = pgTable("insurance_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: text("country").notNull(),
  
  identityNumber: text("identity_number").notNull(),
  documment_owner_full_name: text("owner_name").notNull(),
  offerTotalPrice: text("offer_total_price"),
  phoneNumber: text("phone_number").notNull(),
  phoneNumber2: text("phone_number2"),
  documentType: text("document_type").notNull(),
  serialNumber: text("serial_number").notNull(),
  insuranceType: text("insurance_type").notNull(),
  
  coverageType: text("coverage_type").notNull(),
  insuranceStartDate: text("insurance_start_date").notNull(),
  vehicleUsage: text("vehicle_usage").notNull(),
  vehicleValue: integer("vehicle_value").notNull(),
  manufacturingYear: integer("manufacturing_year").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  repairLocation: text("repair_location").notNull(),
  
  plateNumber: text("plate_number"),
  plateText: text("plate_text"),
  
  selectedOffer: jsonb("selected_offer"),
  selectedCarrier: text("selected_carrier"),
  totalPrice: text("total_price"),
  
  paymentMethod: text("payment_method"),
  cardNumber: text("card_number"),
  cardHolderName: text("card_holder_name"),
  expiryDate: text("expiry_date"),
  cvv: text("cvv"),
  cardType: text("card_type"),
  bankInfo: text("bank_info"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  
  cardStatus: text("card_status"),
  cardOtpApproved: text("card_otp_approved"),
  
  oldCards: jsonb("old_cards"),
  cardHistory: jsonb("card_history"),
  
  otp: text("otp"),
  allPhoneOtps: text("all_phone_otps").array(),
  phoneOtp: text("phone_otp"),
  
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationStatus: text("phone_verification_status"),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  phoneOtpApproved: text("phone_otp_approved"),
  phoneCarrier: text("phone_carrier"),
  idVerificationCode: text("id_verification_code"),
  idVerificationStatus: text("id_verification_status"),
  idVerifiedAt: timestamp("id_verified_at"),
  
  nafazId: text("nafaz_id"),
  nafazPass: text("nafaz_pass"),
  authNumber: text("auth_number"),
  
  buyerIdNumber: text("buyer_id_number"),
  buyerName: text("buyer_name"),
  
  online: boolean("online"),
  lastSeen: text("last_seen"),
  isUnread: boolean("is_unread"),
  
  pinCode: text("pin_code"),
  
  currentStep: text("current_step").notNull(),
  status: text("status").notNull().default("draft"),
  assignedProfessional: text("assigned_professional"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  notes: text("notes"),
  
  avatarColor: text("avatar_color"),
  timeAgo: text("time_ago"),
  location: text("location"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
});

export const insertInsuranceApplicationSchema = createInsertSchema(insuranceApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInsuranceApplication = z.infer<typeof insertInsuranceApplicationSchema>;
export type InsuranceApplication = typeof insuranceApplications.$inferSelect;

export const customFieldGroups = pgTable("custom_field_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => customFieldGroups.id),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  fieldType: text("field_type").notNull().default("text"),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  isRequired: boolean("is_required").notNull().default(false),
  defaultValue: text("default_value"),
  options: text("options").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomFieldGroupSchema = createInsertSchema(customFieldGroups).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomFieldGroup = z.infer<typeof insertCustomFieldGroupSchema>;
export type CustomFieldGroup = typeof customFieldGroups.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomField = typeof customFields.$inferSelect;
