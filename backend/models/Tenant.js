import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    aadharNumber: { type: String },
    identityProof: { type: String }, // URL to uploaded ID document
    occupation: { type: String },
    nativePlace: { type: String },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    roomCategory: { type: String },
    moveInDate: { type: Date },
    expectedDuration: { type: String }, // e.g., "6 months", "1 year"
    emergencyContactName: { type: String },
    emergencyContactRelationship: { type: String },
    emergencyContactPhone: { type: String },
    securityDeposit: { type: Number },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""] },
    medicalCondition: { type: String },
    photo: { type: String }, // URL to tenant photo with ID
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    digitalSignature: { type: String }, // URL or base64 of signature
    organizationalCode: { type: String }, // Code used during registration
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
    active: { type: Boolean, default: false }, // Changed: default false until approved
  },
  { timestamps: true }
);

tenantSchema.index({ property: 1 });
tenantSchema.index({ active: 1 });
tenantSchema.index({ room: 1 });
tenantSchema.index({ email: 1 });
tenantSchema.index({ createdAt: -1 });
tenantSchema.index({ approvalStatus: 1 });
tenantSchema.index({ organizationalCode: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
