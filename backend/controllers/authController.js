import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  const { name, email, phone, password, organizationalCode } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // If organizational code provided, validate it belongs to a verified admin/property
    let propertyId = null;
    if (organizationalCode) {
      const ownerUser = await User.findOne({ organizationalCode, role: { $in: ["admin", "superadmin"] } });
      if (!ownerUser) {
        // Also check Property model
        const Property = (await import("../models/Property.js")).default;
        const property = await Property.findOne({ organizationalCode });
        if (!property) {
          return res.status(400).json({ message: "Invalid organizational code" });
        }
        propertyId = property._id;
      } else {
        propertyId = ownerUser.propertyId;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
      role: "tenant",
      propertyId,
    });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      requiresOnboarding: user.role === 'tenant' && !user.tenantId,
      verificationStatus: user.verificationStatus || 'unverified',
      organizationalCode: user.organizationalCode || null,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserTenant = async (req, res) => {
  const { userId, tenantId } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { tenantId }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      profileImage: user.profileImage || null,
      verificationStatus: user.verificationStatus || 'unverified',
      organizationalCode: user.organizationalCode || null,
      qrCode: user.qrCode || null,
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
      settings: user.settings || {
        notifications: {
          emailNotifications: {
            newTenants: true,
            paymentReminders: true,
            maintenanceRequests: true,
            systemUpdates: false,
          },
          appNotifications: {
            pushNotifications: true,
            soundAlerts: true,
            desktopNotifications: false,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage || null,
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ profileImage: user.profileImage, message: "Profile image uploaded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  const { notifications } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { settings: { notifications } },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // TODO: In production, send email with resetToken link
    // For now, we construct a frontend reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    res.json({
      message: "Password reset link has been generated. Check your email.",
      resetUrl, // In production, send this via email and remove from response
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
