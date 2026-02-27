import express from "express";
import {
  getHostels,
  getHostel,
  verifyHostel,
  deleteHostel,
  getPlatformStats,
  getAdmins,
  updateUserRole,
} from "../controllers/superAdminController.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require superadmin
router.use(protect, superAdminOnly);

router.get("/stats", getPlatformStats);
router.get("/hostels", getHostels);
router.get("/hostels/:id", getHostel);
router.put("/hostels/:id/verify", verifyHostel);
router.delete("/hostels/:id", deleteHostel);
router.get("/admins", getAdmins);
router.put("/admins/:id/role", updateUserRole);

export default router;
