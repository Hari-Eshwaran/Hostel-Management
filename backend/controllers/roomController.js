import Room from "../models/Room.js";

// Helper: scope query to user's property (admin/staff see their hostel only, superadmin sees all)
const scopeByProperty = (query, user) => {
  if (user.role !== "superadmin" && user.propertyId) {
    query.property = user.propertyId;
  }
  return query;
};

export const getRooms = async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 10 } = req.query;
    let query = {};
    scopeByProperty(query, req.user);

    // Search functionality
    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    const rooms = await Room.find(query)
      .sort({ number: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRoom = async (req, res) => {
  try {
    const { number, type, rent, capacity, status } = req.body;
    const propertyId = req.user.propertyId || undefined;
    const room = await Room.create({ property: propertyId, number, type, rent, capacity, status });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { number, type, rent, capacity, status, occupancy } = req.body;
    const allowedFields = {};
    if (number !== undefined) allowedFields.number = number;
    if (type !== undefined) allowedFields.type = type;
    if (rent !== undefined) allowedFields.rent = rent;
    if (capacity !== undefined) allowedFields.capacity = capacity;
    if (status !== undefined) allowedFields.status = status;
    if (occupancy !== undefined) allowedFields.occupancy = occupancy;
    const room = await Room.findByIdAndUpdate(req.params.id, allowedFields, { new: true });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoomStats = async (req, res) => {
  try {
    let filter = {};
    scopeByProperty(filter, req.user);

    const totalRooms = await Room.countDocuments(filter);
    const availableRooms = await Room.countDocuments({ ...filter, status: 'available' });
    const occupiedRooms = await Room.countDocuments({ ...filter, status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ ...filter, status: 'maintenance' });

    const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];
    const roomsByType = await Room.aggregate([
      ...matchStage,
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const totalOccupancy = await Room.aggregate([
      ...matchStage,
      { $group: { _id: null, total: { $sum: "$occupancy" }, capacity: { $sum: "$capacity" } } }
    ]);

    res.json({
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      maintenance: maintenanceRooms,
      byType: roomsByType,
      occupancy: totalOccupancy[0] || { total: 0, capacity: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
