import Property from "../models/Property.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Seeds the database with defaults on server startup:
 * 1. A SuperAdmin account (if none exists)
 * 2. A default hostel "Thenam Hostel" (if no hostels exist)
 *
 * This ensures the platform always has an entry point.
 */
const seedDefaults = async () => {
  try {
    // 1. Ensure a SuperAdmin exists
    let superAdmin = await User.findOne({ role: "superadmin" });
    if (!superAdmin) {
      const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      superAdmin = await User.create({
        name: "Super Admin",
        email: process.env.SUPERADMIN_EMAIL || "superadmin@thenam.com",
        phone: process.env.SUPERADMIN_PHONE || "9999999999",
        password: hashed,
        role: "superadmin",
        verificationStatus: "verified",
        verifiedAt: new Date(),
      });
      console.log(`✅ Default SuperAdmin created: ${superAdmin.email}`);
    }

    // 2. Ensure default "Thenam Hostel" exists
    const hostelCount = await Property.countDocuments();
    if (hostelCount === 0) {
      const orgCode = `ORG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      const defaultHostel = await Property.create({
        name: "Thenam Hostel",
        address: "Chennai, Tamil Nadu, India",
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verifiedBy: superAdmin._id,
        organizationalCode: orgCode,
      });
      console.log(`✅ Default hostel "Thenam Hostel" created (Org Code: ${orgCode})`);
    }
  } catch (error) {
    console.error("⚠️  Seed defaults error:", error.message);
  }
};

export default seedDefaults;
