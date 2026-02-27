import express from "express";
import {
  getHostels,
  getHostel,
  createHostel,
  updateHostel,
  verifyHostel,
  deleteHostel,
  getPlatformStats,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateUserRole,
  getUnassignedHostels,
} from "../controllers/superAdminController.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require superadmin
router.use(protect, superAdminOnly);

// Platform stats
router.get("/stats", getPlatformStats);

// Hostel CRUD
router.get("/hostels-unassigned", getUnassignedHostels);
router.get("/hostels", getHostels);
router.get("/hostels/:id", getHostel);
router.post("/hostels", createHostel);
router.put("/hostels/:id", updateHostel);
router.put("/hostels/:id/verify", verifyHostel);
router.delete("/hostels/:id", deleteHostel);

// Admin CRUD
router.get("/admins", getAdmins);
router.post("/admins", createAdmin);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);
router.put("/admins/:id/role", updateUserRole);

export default router;
