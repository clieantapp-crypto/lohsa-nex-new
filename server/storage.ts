import { 
  users, 
  type User, 
  type InsertUser,
  insuranceApplications,
  type InsuranceApplication,
  type InsertInsuranceApplication,
  customFieldGroups,
  customFields,
  type CustomFieldGroup,
  type InsertCustomFieldGroup,
  type CustomField,
  type InsertCustomField
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getInsuranceApplications(): Promise<InsuranceApplication[]>;
  getInsuranceApplication(id: string): Promise<InsuranceApplication | undefined>;
  createInsuranceApplication(application: InsertInsuranceApplication): Promise<InsuranceApplication>;
  updateInsuranceApplication(id: string, application: Partial<InsertInsuranceApplication>): Promise<InsuranceApplication | undefined>;
  deleteInsuranceApplication(id: string): Promise<void>;
  
  getCustomFieldGroups(): Promise<CustomFieldGroup[]>;
  getCustomFieldGroup(id: string): Promise<CustomFieldGroup | undefined>;
  createCustomFieldGroup(group: InsertCustomFieldGroup): Promise<CustomFieldGroup>;
  updateCustomFieldGroup(id: string, group: Partial<InsertCustomFieldGroup>): Promise<CustomFieldGroup | undefined>;
  deleteCustomFieldGroup(id: string): Promise<void>;
  
  getCustomFields(): Promise<CustomField[]>;
  getCustomFieldsByGroup(groupId: string): Promise<CustomField[]>;
  getCustomField(id: string): Promise<CustomField | undefined>;
  createCustomField(field: InsertCustomField): Promise<CustomField>;
  updateCustomField(id: string, field: Partial<InsertCustomField>): Promise<CustomField | undefined>;
  deleteCustomField(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getInsuranceApplications(): Promise<InsuranceApplication[]> {
    const applications = await db
      .select()
      .from(insuranceApplications)
      .orderBy(desc(insuranceApplications.createdAt));
    return applications;
  }

  async getInsuranceApplication(id: string): Promise<InsuranceApplication | undefined> {
    const [application] = await db
      .select()
      .from(insuranceApplications)
      .where(eq(insuranceApplications.id, id));
    return application || undefined;
  }

  async createInsuranceApplication(application: InsertInsuranceApplication): Promise<InsuranceApplication> {
    const [newApplication] = await db
      .insert(insuranceApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateInsuranceApplication(
    id: string, 
    application: Partial<InsertInsuranceApplication>
  ): Promise<InsuranceApplication | undefined> {
    const [updated] = await db
      .update(insuranceApplications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(insuranceApplications.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteInsuranceApplication(id: string): Promise<void> {
    await db
      .delete(insuranceApplications)
      .where(eq(insuranceApplications.id, id));
  }

  async getCustomFieldGroups(): Promise<CustomFieldGroup[]> {
    return await db
      .select()
      .from(customFieldGroups)
      .orderBy(asc(customFieldGroups.order));
  }

  async getCustomFieldGroup(id: string): Promise<CustomFieldGroup | undefined> {
    const [group] = await db
      .select()
      .from(customFieldGroups)
      .where(eq(customFieldGroups.id, id));
    return group || undefined;
  }

  async createCustomFieldGroup(group: InsertCustomFieldGroup): Promise<CustomFieldGroup> {
    const [newGroup] = await db
      .insert(customFieldGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async updateCustomFieldGroup(
    id: string,
    group: Partial<InsertCustomFieldGroup>
  ): Promise<CustomFieldGroup | undefined> {
    const [updated] = await db
      .update(customFieldGroups)
      .set(group)
      .where(eq(customFieldGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomFieldGroup(id: string): Promise<void> {
    await db.delete(customFields).where(eq(customFields.groupId, id));
    await db.delete(customFieldGroups).where(eq(customFieldGroups.id, id));
  }

  async getCustomFields(): Promise<CustomField[]> {
    return await db
      .select()
      .from(customFields)
      .orderBy(asc(customFields.order));
  }

  async getCustomFieldsByGroup(groupId: string): Promise<CustomField[]> {
    return await db
      .select()
      .from(customFields)
      .where(eq(customFields.groupId, groupId))
      .orderBy(asc(customFields.order));
  }

  async getCustomField(id: string): Promise<CustomField | undefined> {
    const [field] = await db
      .select()
      .from(customFields)
      .where(eq(customFields.id, id));
    return field || undefined;
  }

  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    const [newField] = await db
      .insert(customFields)
      .values(field)
      .returning();
    return newField;
  }

  async updateCustomField(
    id: string,
    field: Partial<InsertCustomField>
  ): Promise<CustomField | undefined> {
    const [updated] = await db
      .update(customFields)
      .set(field)
      .where(eq(customFields.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomField(id: string): Promise<void> {
    await db.delete(customFields).where(eq(customFields.id, id));
  }
}

export const storage = new DatabaseStorage();
