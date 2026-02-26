import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "staff", "tenant"],
      default: "tenant",
    },
    phone: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // For tenant role users
    // Owner/Admin verification
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verifiedAt: { type: Date },
    organizationalCode: { type: String, unique: true, sparse: true }, // Unique code for tenant registration
    qrCode: { type: String }, // QR code data URL for tenant onboarding
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    profileImage: { type: String }, // URL to profile image
    settings: {
      notifications: {
        emailNotifications: {
          newTenants: { type: Boolean, default: true },
          paymentReminders: { type: Boolean, default: true },
          maintenanceRequests: { type: Boolean, default: true },
          systemUpdates: { type: Boolean, default: false },
        },
        appNotifications: {
          pushNotifications: { type: Boolean, default: true },
          soundAlerts: { type: Boolean, default: true },
          desktopNotifications: { type: Boolean, default: false },
        },
      },
    },
  },
  { timestamps: true }
);

// Generate organizational code for admin users
userSchema.methods.generateOrgCode = function () {
  const code = `ORG-${this._id.toString().slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  this.organizationalCode = code;
  return code;
};

userSchema.index({ organizationalCode: 1 });
userSchema.index({ verificationStatus: 1 });

const User = mongoose.model("User", userSchema);
export default User;
