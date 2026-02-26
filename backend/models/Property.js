import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Owner details
    ownerFullName: { type: String },
    ownerPAN: { type: String },
    ownerBusinessPhone: { type: String },
    ownerBusinessEmail: { type: String },
    ownerPersonalPhone: { type: String },
    ownerPersonalEmail: { type: String },
    ownerGovernmentId: { type: String }, // URL to uploaded ID
    ownerGovernmentIdType: {
      type: String,
      enum: ["aadhaar", "passport", "voter_id", ""],
    },
    // Verification documents
    tradeLicense: { type: String }, // URL to uploaded document
    fireSafetyCertificate: { type: String },
    noc: { type: String }, // No Objection Certificate
    proofOfAddress: { type: String }, // e.g., electricity bill
    gstCertificate: { type: String },
    buildingOccupancyCertificate: { type: String },
    leaseAgreement: { type: String },
    insuranceCertificate: { type: String },
    healthSanitationCertificate: { type: String },
    // Verification status
    verificationStatus: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected"],
      default: "pending",
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    // Operational
    organizationalCode: { type: String, unique: true, sparse: true },
    qrCode: { type: String },
  },
  { timestamps: true }
);

propertySchema.index({ owner: 1 });
propertySchema.index({ verificationStatus: 1 });
propertySchema.index({ organizationalCode: 1 });

const Property = mongoose.model("Property", propertySchema);
export default Property;