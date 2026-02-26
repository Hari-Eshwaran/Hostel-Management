import express from "express";
import {
  getTenants,
  getTenant,
  addTenant,
  onboardTenant,
  updateTenant,
  deleteTenant,
  getTenantStats,
  getTenantDashboard,
  sendSMSToTenants,
  sendManualSMS,
  approveTenant,
  rejectTenant,
} from "../controllers/tenantController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { addTenantRules, onboardTenantRules, validate } from "../middleware/validators.js";
import { smsLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", protect, getTenants);
router.get("/stats", protect, adminOnly, getTenantStats);
// Tenant dashboard endpoint (must be before /:id)
router.get("/dashboard/my-info", protect, getTenantDashboard);
router.get("/:id", protect, getTenant);
// only admin can add or delete tenants
router.post("/", protect, adminOnly, addTenantRules, validate, addTenant);
router.post("/onboard", protect, onboardTenantRules, validate, onboardTenant);
// Tenant approval workflow
router.put("/:id/approve", protect, adminOnly, approveTenant);
router.put("/:id/reject", protect, adminOnly, rejectTenant);
router.put("/:id", protect, adminOnly, updateTenant);
router.delete("/:id", protect, adminOnly, deleteTenant);

// Send SMS to selected tenants
router.post("/send-sms", protect, adminOnly, smsLimiter, sendSMSToTenants);

// Send manual SMS to any number
router.post("/send-manual-sms", protect, adminOnly, smsLimiter, sendManualSMS);

export default router;
