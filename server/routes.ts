import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInsuranceApplicationSchema, insertCustomFieldGroupSchema, insertCustomFieldSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getInsuranceApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getInsuranceApplication(id);

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertInsuranceApplicationSchema.parse(req.body);
      const newApplication =
        await storage.createInsuranceApplication(validatedData);
      res.status(201).json(newApplication);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedApplication = await storage.updateInsuranceApplication(
        id,
        req.body,
      );

      if (!updatedApplication) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInsuranceApplication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ error: "Failed to delete application" });
    }
  });

  app.get("/api/bin-lookup/:bin", async (req, res) => {
    try {
      const { bin } = req.params;
      const apiKey = process.env.RAPIDAPI_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
      }

      const url = `https://bin-ip-checker.p.rapidapi.com/?bin=${bin}`;
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "bin-ip-checker.p.rapidapi.com",
        },
      };

      const response = await fetch(url, options);
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("BIN lookup error:", error);
      res.status(500).json({ error: "Failed to lookup BIN" });
    }
  });

  app.get("/api/field-groups", async (req, res) => {
    try {
      const groups = await storage.getCustomFieldGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching field groups:", error);
      res.status(500).json({ error: "Failed to fetch field groups" });
    }
  });

  app.post("/api/field-groups", async (req, res) => {
    try {
      const validatedData = insertCustomFieldGroupSchema.parse(req.body);
      const newGroup = await storage.createCustomFieldGroup(validatedData);
      res.status(201).json(newGroup);
    } catch (error) {
      console.error("Error creating field group:", error);
      res.status(400).json({ error: "Invalid field group data" });
    }
  });

  app.patch("/api/field-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedGroup = await storage.updateCustomFieldGroup(id, req.body);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Field group not found" });
      }
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating field group:", error);
      res.status(500).json({ error: "Failed to update field group" });
    }
  });

  app.delete("/api/field-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomFieldGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting field group:", error);
      res.status(500).json({ error: "Failed to delete field group" });
    }
  });

  app.get("/api/fields", async (req, res) => {
    try {
      const fields = await storage.getCustomFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching fields:", error);
      res.status(500).json({ error: "Failed to fetch fields" });
    }
  });

  app.get("/api/fields/group/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const fields = await storage.getCustomFieldsByGroup(groupId);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching fields by group:", error);
      res.status(500).json({ error: "Failed to fetch fields" });
    }
  });

  app.post("/api/fields", async (req, res) => {
    try {
      const validatedData = insertCustomFieldSchema.parse(req.body);
      const newField = await storage.createCustomField(validatedData);
      res.status(201).json(newField);
    } catch (error) {
      console.error("Error creating field:", error);
      res.status(400).json({ error: "Invalid field data" });
    }
  });

  app.patch("/api/fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedField = await storage.updateCustomField(id, req.body);
      if (!updatedField) {
        return res.status(404).json({ error: "Field not found" });
      }
      res.json(updatedField);
    } catch (error) {
      console.error("Error updating field:", error);
      res.status(500).json({ error: "Failed to update field" });
    }
  });

  app.delete("/api/fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomField(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting field:", error);
      res.status(500).json({ error: "Failed to delete field" });
    }
  });

  return httpServer;
}
