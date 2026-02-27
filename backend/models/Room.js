import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    number: { type: String, required: true },
    type: { type: String, enum: ["single", "double", "shared"], default: "single" },
    rent: { type: Number, required: true },
    occupancy: { type: Number, default: 0 },
    capacity: { type: Number, default: 1 },
    status: { type: String, enum: ["available", "occupied", "maintenance"], default: "available" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ property: 1, number: 1 }, { unique: true });
roomSchema.index({ property: 1, status: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ active: 1 });
roomSchema.index({ type: 1, status: 1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
