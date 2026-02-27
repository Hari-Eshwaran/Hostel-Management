import Property from "../models/Property.js";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Room from "../models/Room.js";

// GET /api/superadmin/hostels — list all hostels with stats
export const getHostels = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { ownerFullName: { $regex: search, $options: "i" } },
        { organizationalCode: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.verificationStatus = status;
    }

    const properties = await Property.find(query)
      .populate("owner", "name email phone role verificationStatus")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    // Attach stats for each hostel
    const hostels = await Promise.all(
      properties.map(async (prop) => {
        const [totalTenants, activeTenants, pendingTenants, totalRooms, availableRooms] =
          await Promise.all([
            Tenant.countDocuments({ property: prop._id }),
            Tenant.countDocuments({ property: prop._id, active: true }),
            Tenant.countDocuments({ property: prop._id, approvalStatus: "pending" }),
            Room.countDocuments({ property: prop._id }),
            Room.countDocuments({ property: prop._id, status: "available" }),
          ]);

        return {
          ...prop,
          stats: { totalTenants, activeTenants, pendingTenants, totalRooms, availableRooms },
        };
      })
    );

    const total = await Property.countDocuments(query);

    res.json({
      hostels,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/superadmin/hostels/:id — single hostel with full details
export const getHostel = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "name email phone role verificationStatus")
      .lean();

    if (!property) return res.status(404).json({ message: "Hostel not found" });

    const [tenants, rooms, admins] = await Promise.all([
      Tenant.find({ property: property._id }).populate("room").lean(),
      Room.find({ property: property._id }).lean(),
      User.find({ propertyId: property._id, role: { $in: ["admin", "staff"] } })
        .select("name email phone role verificationStatus createdAt")
        .lean(),
    ]);

    res.json({ hostel: property, tenants, rooms, admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/superadmin/hostels/:id/verify — verify or reject a hostel
export const verifyHostel = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: "verify" | "reject"
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Hostel not found" });

    if (action === "verify") {
      property.verificationStatus = "verified";
      property.verifiedAt = new Date();
      property.verifiedBy = req.user._id;
      property.rejectionReason = undefined;

      // Also verify the owner
      if (property.owner) {
        await User.findByIdAndUpdate(property.owner, {
          verificationStatus: "verified",
          verifiedAt: new Date(),
        });
      }
    } else if (action === "reject") {
      property.verificationStatus = "rejected";
      property.rejectionReason = reason || "No reason provided";

      if (property.owner) {
        await User.findByIdAndUpdate(property.owner, {
          verificationStatus: "rejected",
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'verify' or 'reject'." });
    }

    await property.save();
    res.json({ message: `Hostel ${action === "verify" ? "verified" : "rejected"} successfully`, hostel: property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/superadmin/hostels/:id — remove a hostel and its data
export const deleteHostel = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Hostel not found" });

    // Remove all associated data
    await Promise.all([
      Tenant.deleteMany({ property: property._id }),
      Room.deleteMany({ property: property._id }),
      User.updateMany({ propertyId: property._id }, { $unset: { propertyId: 1 } }),
      Property.findByIdAndDelete(property._id),
    ]);

    res.json({ message: "Hostel and all associated data removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/superadmin/stats — platform-wide stats
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalHostels,
      verifiedHostels,
      pendingHostels,
      rejectedHostels,
      totalAdmins,
      totalTenants,
      activeTenants,
      totalRooms,
      availableRooms,
    ] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ verificationStatus: "verified" }),
      Property.countDocuments({ verificationStatus: "pending" }),
      Property.countDocuments({ verificationStatus: "rejected" }),
      User.countDocuments({ role: "admin" }),
      Tenant.countDocuments(),
      Tenant.countDocuments({ active: true }),
      Room.countDocuments(),
      Room.countDocuments({ status: "available" }),
    ]);

    res.json({
      totalHostels,
      verifiedHostels,
      pendingHostels,
      rejectedHostels,
      totalAdmins,
      totalTenants,
      activeTenants,
      totalRooms,
      availableRooms,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/superadmin/admins — all admin users
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("name email phone verificationStatus propertyId createdAt")
      .populate("propertyId", "name address verificationStatus organizationalCode")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/superadmin/admins/:id/role — change user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "staff", "tenant"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "superadmin") return res.status(403).json({ message: "Cannot change superadmin role" });

    user.role = role;
    await user.save();
    res.json({ message: `User role updated to ${role}`, user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
