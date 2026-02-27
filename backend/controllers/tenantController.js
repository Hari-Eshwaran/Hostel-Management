import Tenant from "../models/Tenant.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

// Helper: scope query to user's property (admin/staff see their hostel only, superadmin sees all)
const scopeByProperty = (query, user) => {
  if (user.role !== "superadmin" && user.propertyId) {
    query.property = user.propertyId;
  }
  return query;
};

export const getTenants = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    let query = {};
    scopeByProperty(query, req.user);

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.active = status === 'active';
    }

    const tenants = await Tenant.find(query)
      .populate("room")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tenant.countDocuments(query);

    res.json({
      tenants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate("room");
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTenant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      aadharNumber,
      room: roomId,
      moveInDate,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      securityDeposit,
      // New fields from flow
      dateOfBirth,
      gender,
      occupation,
      nativePlace,
      bloodGroup,
      medicalCondition,
      expectedDuration,
      roomCategory,
    } = req.body;

    // Check room availability
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      if (room.occupancy >= room.capacity) return res.status(400).json({ message: "Room is fully occupied" });
    }

    const tenant = await Tenant.create({
      property: req.user.propertyId || undefined,
      firstName,
      lastName,
      email,
      phone,
      aadharNumber,
      room: roomId,
      moveInDate,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      securityDeposit,
      dateOfBirth,
      gender,
      occupation,
      nativePlace,
      bloodGroup: bloodGroup || '',
      medicalCondition,
      expectedDuration,
      roomCategory,
      approvalStatus: 'approved', // Admin-added tenants are auto-approved
      approvedBy: req.user.id,
      approvalDate: new Date(),
      active: true, // Admin-added tenants are immediately active
    });

    if (roomId) {
      const room = await Room.findByIdAndUpdate(roomId, { $inc: { occupancy: 1 } }, { new: true });
      if (room && room.occupancy >= room.capacity) {
        await Room.findByIdAndUpdate(roomId, { status: 'occupied' });
      }
    }

    const populatedTenant = await Tenant.findById(tenant._id).populate("room");
    res.status(201).json(populatedTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const onboardTenant = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.tenantId) return res.status(400).json({ message: "User already onboarded" });

    const {
      aadharNumber,
      room: roomId,
      moveInDate,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      securityDeposit,
      // New fields from flow
      dateOfBirth,
      gender,
      occupation,
      nativePlace,
      bloodGroup,
      medicalCondition,
      expectedDuration,
      termsAccepted,
      identityProof,
      photo,
      digitalSignature,
      roomCategory,
    } = req.body;

    // Check room availability
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      if (room.occupancy >= room.capacity) return res.status(400).json({ message: "Room is fully occupied" });
    }

    // Require terms acceptance
    if (!termsAccepted) {
      return res.status(400).json({ message: "You must accept the terms and conditions" });
    }

    // Split name into first and last
    const nameParts = user.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const tenant = await Tenant.create({
      property: user.propertyId || undefined,
      firstName,
      lastName,
      email: user.email,
      phone: user.phone,
      aadharNumber,
      room: roomId,
      moveInDate,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      securityDeposit,
      dateOfBirth,
      gender,
      occupation,
      nativePlace,
      bloodGroup: bloodGroup || '',
      medicalCondition,
      expectedDuration,
      termsAccepted,
      termsAcceptedAt: termsAccepted ? new Date() : undefined,
      identityProof,
      photo,
      digitalSignature,
      roomCategory,
      organizationalCode: user.propertyId ? undefined : undefined, // Will be set if applicable
      approvalStatus: 'pending', // Tenant starts as pending until admin approves
      active: false, // Not active until approved
    });

    // Update user with tenantId
    await User.findByIdAndUpdate(user._id, { tenantId: tenant._id });

    // Don't update room occupancy yet — wait for approval
    const populatedTenant = await Tenant.findById(tenant._id).populate("room");
    res.status(201).json({
      ...populatedTenant.toObject(),
      message: "Registration submitted. Awaiting admin approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, aadharNumber, room, moveInDate, emergencyContactName, emergencyContactRelationship, emergencyContactPhone, securityDeposit, active, dateOfBirth, gender, occupation, nativePlace, bloodGroup, medicalCondition, expectedDuration, roomCategory } = req.body;
    const allowedFields = {};
    if (firstName !== undefined) allowedFields.firstName = firstName;
    if (lastName !== undefined) allowedFields.lastName = lastName;
    if (email !== undefined) allowedFields.email = email;
    if (phone !== undefined) allowedFields.phone = phone;
    if (aadharNumber !== undefined) allowedFields.aadharNumber = aadharNumber;
    if (room !== undefined) allowedFields.room = room;
    if (moveInDate !== undefined) allowedFields.moveInDate = moveInDate;
    if (emergencyContactName !== undefined) allowedFields.emergencyContactName = emergencyContactName;
    if (emergencyContactRelationship !== undefined) allowedFields.emergencyContactRelationship = emergencyContactRelationship;
    if (emergencyContactPhone !== undefined) allowedFields.emergencyContactPhone = emergencyContactPhone;
    if (securityDeposit !== undefined) allowedFields.securityDeposit = securityDeposit;
    if (active !== undefined) allowedFields.active = active;
    if (dateOfBirth !== undefined) allowedFields.dateOfBirth = dateOfBirth;
    if (gender !== undefined) allowedFields.gender = gender;
    if (occupation !== undefined) allowedFields.occupation = occupation;
    if (nativePlace !== undefined) allowedFields.nativePlace = nativePlace;
    if (bloodGroup !== undefined) allowedFields.bloodGroup = bloodGroup;
    if (medicalCondition !== undefined) allowedFields.medicalCondition = medicalCondition;
    if (expectedDuration !== undefined) allowedFields.expectedDuration = expectedDuration;
    if (roomCategory !== undefined) allowedFields.roomCategory = roomCategory;

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, allowedFields, { new: true, runValidators: true }).populate("room");
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve a tenant registration (admin only)
export const approveTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    if (tenant.approvalStatus === 'approved') {
      return res.status(400).json({ message: "Tenant is already approved" });
    }

    tenant.approvalStatus = 'approved';
    tenant.approvedBy = req.user.id;
    tenant.approvalDate = new Date();
    tenant.active = true;
    await tenant.save();

    // Update room occupancy now that tenant is approved
    if (tenant.room) {
      const room = await Room.findByIdAndUpdate(tenant.room, { $inc: { occupancy: 1 } }, { new: true });
      if (room && room.occupancy >= room.capacity) {
        await Room.findByIdAndUpdate(tenant.room, { status: 'occupied' });
      }
    }

    // Send SMS notification to tenant
    try {
      const { sendSMS } = await import("../utils/sendSMS.js");
      if (tenant.phone) {
        await sendSMS(tenant.phone, `Hello ${tenant.firstName}, your tenant registration has been approved! You can now log in to RootnSpace.`, 'tenant-approval');
      }
    } catch (smsErr) {
      // SMS is best-effort, don't fail the approval
    }

    const populatedTenant = await Tenant.findById(tenant._id).populate("room");
    res.json({ message: "Tenant approved successfully", tenant: populatedTenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject a tenant registration (admin only)
export const rejectTenant = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    tenant.approvalStatus = 'rejected';
    tenant.rejectionReason = rejectionReason || 'No reason provided';
    tenant.active = false;
    await tenant.save();

    const populatedTenant = await Tenant.findById(tenant._id).populate("room");
    res.json({ message: "Tenant rejected", tenant: populatedTenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.room) {
      await Room.findByIdAndUpdate(tenant.room, { $inc: { occupancy: -1 } });
    }

    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: "Tenant removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTenantStats = async (req, res) => {
  try {
    let filter = {};
    scopeByProperty(filter, req.user);

    const totalTenants = await Tenant.countDocuments(filter);
    const activeTenants = await Tenant.countDocuments({ ...filter, active: true });
    const inactiveTenants = totalTenants - activeTenants;

    const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];
    const tenantsByRoom = await Tenant.aggregate([
      ...matchStage,
      { $match: { room: { $ne: null } } },
      { $group: { _id: "$room", count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalTenants,
      active: activeTenants,
      inactive: inactiveTenants,
      byRoom: tenantsByRoom
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTenantDashboard = async (req, res) => {
  try {
    const tenantId = req.user.role === 'tenant' ? req.user.tenantId : req.params.tenantId;

    // Get tenant info
    const tenant = await Tenant.findById(tenantId).populate("room");
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Get recent payments (last 5)
    const Payment = (await import("../models/Payment.js")).default;
    const recentPayments = await Payment.find({ tenant: tenantId })
      .sort({ paidAt: -1 })
      .limit(5);

    // Get active tickets
    const Ticket = (await import("../models/Ticket.js")).default;
    const activeTickets = await Ticket.find({
      tenant: tenantId,
      status: { $in: ['open', 'in_progress'] }
    }).sort({ createdAt: -1 });

    // Calculate current rent due (simplified - you might want to implement proper rent calculation)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get last payment to determine due date
    const lastPayment = await Payment.findOne({
      tenant: tenantId,
      type: 'rent'
    }).sort({ paidAt: -1 });

    let dueDate = new Date(currentYear, currentMonth + 1, 1); // 1st of next month
    let currentRent = 0;

    if (lastPayment) {
      const lastPaymentDate = new Date(lastPayment.paidAt);
      dueDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth() + 1, lastPaymentDate.getDate());
      currentRent = lastPayment.amount; // Assuming rent amount is consistent
    }

    // Get active issues (open tickets)
    const activeIssues = activeTickets.length;

    res.json({
      userName: `${tenant.firstName} ${tenant.lastName}`,
      currentRent,
      dueDate,
      activeIssues,
      roomNumber: tenant.room ? tenant.room.roomNumber : null,
      recentInvoices: recentPayments,
      activeTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendSMSToTenants = async (req, res) => {
  try {
    const { tenantIds, message } = req.body;

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ message: "Tenant IDs array is required" });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: "Message is required" });
    }

    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select('firstName lastName phone');

    if (tenants.length === 0) {
      return res.status(404).json({ message: "No tenants found" });
    }

    const { sendSMS } = await import("../utils/sendSMS.js");

    const results = [];
    for (const tenant of tenants) {
      const fullMessage = `Hello ${tenant.firstName} ${tenant.lastName}, ${message}`;
      const result = await sendSMS(tenant.phone, fullMessage, 'admin-notification');
      results.push({
        tenantId: tenant._id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        phone: tenant.phone,
        success: result.success,
        error: result.error || null
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      message: `SMS sent to ${successCount} tenants, ${failureCount} failed`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendManualSMS = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: "Message is required" });
    }

    const { sendSMS } = await import("../utils/sendSMS.js");

    const result = await sendSMS(phone.trim(), message.trim(), 'manual');

    if (result.success) {
      res.json({ message: "SMS sent successfully", sid: result.sid });
    } else {
      res.status(500).json({ message: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
