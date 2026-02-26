import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, X, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiFetch from '@/lib/apiClient';
import Pagination from '@/components/Pagination';

const TenantManagement = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selectedTenants, setSelectedTenants] = useState([]);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("Important notification from RootnSpace.");
  const [sendingSMS, setSendingSMS] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    aadharNumber: "",
    roomAssignment: "",
    moveInDate: "",
    gender: "",
    dateOfBirth: "",
    occupation: "",
    nativePlace: "",
    bloodGroup: "",
    medicalCondition: "",
    expectedDuration: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    securityDeposit: ""
  });

  const [errors, setErrors] = useState({});

  // Load tenants and rooms on component mount
  useEffect(() => {
    loadTenants();
    loadRooms();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/tenants');
      setTenants(response.tenants || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await apiFetch('/rooms');
      setRooms(response.rooms || []);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear errors while typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    // ✅ Validation for required fields
    if (!formData.firstName.trim()) newErrors.firstName = `${t('tenantManagement.firstName')} ${t('tenantManagement.required')}`;
    if (!formData.lastName.trim()) newErrors.lastName = `${t('tenantManagement.lastName')} ${t('tenantManagement.required')}`;
    if (!formData.email.trim()) newErrors.email = `${t('tenantManagement.email')} ${t('tenantManagement.required')}`;
    if (!formData.phone.trim()) newErrors.phone = `${t('tenantManagement.phone')} ${t('tenantManagement.required')}`;
    if (!formData.aadharNumber.trim()) newErrors.aadharNumber = `${t('tenantManagement.aadharNumber')} ${t('tenantManagement.required')}`;
    if (!formData.roomAssignment.trim()) newErrors.roomAssignment = t('tenantManagement.roomSelectionRequired');
    if (!formData.moveInDate.trim()) newErrors.moveInDate = `${t('tenantManagement.moveInDateLabel')} ${t('tenantManagement.required')}`;
    if (!formData.securityDeposit.trim()) newErrors.securityDeposit = `${t('tenantManagement.securityDeposit')} ${t('tenantManagement.required')}`;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return; // Stop form submission if there are errors
    }

    try {
      const tenantData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        aadharNumber: formData.aadharNumber,
        room: formData.roomAssignment, // This is now the room ID
        moveInDate: formData.moveInDate,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        occupation: formData.occupation,
        nativePlace: formData.nativePlace,
        bloodGroup: formData.bloodGroup,
        medicalCondition: formData.medicalCondition,
        expectedDuration: formData.expectedDuration,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        securityDeposit: parseFloat(formData.securityDeposit)
      };

      await apiFetch('/tenants', {
        method: 'POST',
        body: tenantData
      });

      alert('Tenant added successfully!');
      setShowAddModal(false);
      resetForm();
      loadTenants(); // Reload the tenants list
      loadRooms(); // Reload available rooms
    } catch (err) {
      console.error('Error adding tenant:', err);
      alert(err.message || 'Failed to add tenant');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      aadharNumber: "",
      roomAssignment: "",
      moveInDate: "",
      gender: "",
      dateOfBirth: "",
      occupation: "",
      nativePlace: "",
      bloodGroup: "",
      medicalCondition: "",
      expectedDuration: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      securityDeposit: ""
    });
    setErrors({});
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === "Active") return `${baseClasses} bg-green-100 text-green-800`;
    if (status === "Pending") return `${baseClasses} bg-yellow-100 text-yellow-800`;
    if (status === "Rejected") return `${baseClasses} bg-red-100 text-red-800`;
    return `${baseClasses} bg-muted text-muted-foreground`;
  };

  const getStatusText = (tenant) => {
    if (tenant.approvalStatus === 'pending') return 'Pending Approval';
    if (tenant.approvalStatus === 'rejected') return 'Rejected';
    return tenant.active ? t('tenantManagement.statusActive') : t('tenantManagement.statusInactive');
  };

  const getStatusKey = (tenant) => {
    if (tenant.approvalStatus === 'pending') return 'Pending';
    if (tenant.approvalStatus === 'rejected') return 'Rejected';
    return tenant.active ? 'Active' : 'Inactive';
  };

  const handleApproveTenant = async (tenant) => {
    if (!window.confirm(`Approve ${tenant.firstName} ${tenant.lastName}?`)) return;
    try {
      await apiFetch(`/tenants/${tenant._id}/approve`, { method: 'PUT' });
      alert('Tenant approved successfully!');
      loadTenants();
      loadRooms();
    } catch (err) {
      console.error('Error approving tenant:', err);
      alert(err.message || 'Failed to approve tenant');
    }
  };

  const handleRejectTenant = async (tenant) => {
    const reason = window.prompt(`Enter rejection reason for ${tenant.firstName} ${tenant.lastName}:`);
    if (reason === null) return;
    try {
      await apiFetch(`/tenants/${tenant._id}/reject`, {
        method: 'PUT',
        body: { reason: reason || 'No reason provided' }
      });
      alert('Tenant rejected.');
      loadTenants();
    } catch (err) {
      console.error('Error rejecting tenant:', err);
      alert(err.message || 'Failed to reject tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.room?.number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "active" && tenant.active && tenant.approvalStatus === 'approved') ||
      (filterStatus === "pending" && tenant.approvalStatus === 'pending') ||
      (filterStatus === "rejected" && tenant.approvalStatus === 'rejected') ||
      (filterStatus === "vacated" && !tenant.active && tenant.approvalStatus !== 'pending' && tenant.approvalStatus !== 'rejected');
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) return;

    setSendingSMS(true);
    try {
      await apiFetch('/tenants/send-sms', {
        method: 'POST',
        body: { tenantIds: selectedTenants, message: smsMessage.trim() }
      });
      alert('SMS sent successfully!');
      setShowSMSModal(false);
      setSelectedTenants([]);
      setSmsMessage("Important notification from RootnSpace.");
    } catch (err) {
      console.error('Error sending SMS:', err);
      alert(err.message || 'Failed to send SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      firstName: tenant.firstName || "",
      lastName: tenant.lastName || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      aadharNumber: tenant.aadharNumber || "",
      roomAssignment: tenant.room?._id || "",
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split('T')[0] : "",
      gender: tenant.gender || "",
      dateOfBirth: tenant.dateOfBirth ? new Date(tenant.dateOfBirth).toISOString().split('T')[0] : "",
      occupation: tenant.occupation || "",
      nativePlace: tenant.nativePlace || "",
      bloodGroup: tenant.bloodGroup || "",
      medicalCondition: tenant.medicalCondition || "",
      expectedDuration: tenant.expectedDuration || "",
      emergencyContactName: tenant.emergencyContactName || "",
      emergencyContactRelationship: tenant.emergencyContactRelationship || "",
      emergencyContactPhone: tenant.emergencyContactPhone || "",
      securityDeposit: tenant.securityDeposit ? String(tenant.securityDeposit) : ""
    });
    setShowAddModal(true);
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    try {
      const tenantData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        aadharNumber: formData.aadharNumber,
        room: formData.roomAssignment,
        moveInDate: formData.moveInDate,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        occupation: formData.occupation,
        nativePlace: formData.nativePlace,
        bloodGroup: formData.bloodGroup,
        medicalCondition: formData.medicalCondition,
        expectedDuration: formData.expectedDuration,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        securityDeposit: parseFloat(formData.securityDeposit)
      };

      await apiFetch(`/tenants/${editingTenant._id}`, {
        method: 'PUT',
        body: tenantData
      });

      alert('Tenant updated successfully!');
      setShowAddModal(false);
      setEditingTenant(null);
      resetForm();
      loadTenants();
      loadRooms();
    } catch (err) {
      console.error('Error updating tenant:', err);
      alert(err.message || 'Failed to update tenant');
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete ${tenant.firstName} ${tenant.lastName}? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/tenants/${tenant._id}`, { method: 'DELETE' });
      alert('Tenant deleted successfully!');
      loadTenants();
      loadRooms();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      alert(err.message || 'Failed to delete tenant');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('tenantManagement.title')}</h1>
          <p className="text-muted-foreground">{t('tenantManagement.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 bg-card text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> {t('tenantManagement.export')}
          </button>
          <button
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            onClick={() => setShowSMSModal(true)}
            disabled={selectedTenants.length === 0}
          >
            <MessageSquare className="h-4 w-4" /> Send SMS ({selectedTenants.length})
          </button>
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" /> {t('tenantManagement.addTenant')}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
          <div className="bg-card rounded-xl shadow p-4 mb-4 md:mb-6 flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder={t('tenantManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
          >
            <option value="all">{t('tenantManagement.filterAll')}</option>
            <option value="active">{t('tenantManagement.filterActive')}</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="vacated">{t('tenantManagement.filterVacated')}</option>
          </select>
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-muted-foreground p-4">{t('tenantManagement.loading')}</p>
        ) : error ? (
          <p className="text-center text-red-500 p-4">{error}</p>
        ) : paginatedTenants.length > 0 ? paginatedTenants.map(tenant => (
          <div key={tenant._id} className="bg-card rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedTenants.includes(tenant._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTenants([...selectedTenants, tenant._id]);
                  } else {
                    setSelectedTenants(selectedTenants.filter(id => id !== tenant._id));
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">{tenant.firstName} {tenant.lastName}</p>
                <p className="text-muted-foreground text-sm">{tenant.email}</p>
                <p className="text-muted-foreground text-sm">{tenant.phone}</p>
                <p className="text-muted-foreground text-sm">Aadhaar: {tenant.aadharNumber ? `XXXX-XXXX-${tenant.aadharNumber.slice(-4)}` : 'N/A'}</p>
                <p className="text-foreground text-sm">{tenant.room?.number || t('tenantManagement.noRoomAssigned')} | {t('tenantManagement.moveInDate')}: {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className={getStatusBadge(getStatusKey(tenant))}>{getStatusText(tenant)}</span>
              {tenant.approvalStatus === 'pending' && (
                <>
                  <button onClick={() => handleApproveTenant(tenant)} className="p-1 text-green-600 hover:text-green-800" title="Approve"><CheckCircle className="h-4 w-4" /></button>
                  <button onClick={() => handleRejectTenant(tenant)} className="p-1 text-red-500 hover:text-red-700" title="Reject"><XCircle className="h-4 w-4" /></button>
                </>
              )}
              <button className="p-1 text-muted-foreground hover:text-blue-500"><Eye className="h-4 w-4" /></button>
              <button onClick={() => handleEditTenant(tenant)} className="p-1 text-muted-foreground hover:text-blue-500"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteTenant(tenant)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )) : (
          <p className="text-center text-muted-foreground p-4">{t('tenantManagement.noTenants')}</p>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">{editingTenant ? 'Edit Tenant' : t('tenantManagement.modalTitle')}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingTenant(null); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={editingTenant ? handleUpdateTenant : handleSubmit} className="p-4 space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground font-medium">
                    {t('tenantManagement.firstName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground ${errors.firstName ? "border-red-500" : ""}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-foreground font-medium">
                    {t('tenantManagement.lastName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground ${errors.lastName ? "border-red-500" : ""}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-foreground font-medium">
                  {t('tenantManagement.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-foreground font-medium">
                  {t('tenantManagement.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength="10"
                  className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Aadhaar */}
              <div>
                <label className="text-foreground font-medium">
                  {t('tenantManagement.aadharNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  maxLength="12"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground ${errors.aadharNumber ? "border-red-500" : ""}`}
                />
                {errors.aadharNumber && <p className="text-red-500 text-xs mt-1">{errors.aadharNumber}</p>}
              </div>

              {/* Room & Move-in */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground font-medium">
                    {t('tenantManagement.roomAssignment')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roomAssignment"
                    value={formData.roomAssignment}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground ${errors.roomAssignment ? "border-red-500" : ""}`}
                  >
                    <option value="">{t('tenantManagement.selectRoom')}</option>
                    {rooms.filter(room => room.status === 'available').map(room => (
                      <option key={room._id} value={room._id}>{room.number}</option>
                    ))}
                  </select>
                  {errors.roomAssignment && <p className="text-red-500 text-xs mt-1">{errors.roomAssignment}</p>}
                </div>
                <div>
                  <label className="text-foreground font-medium">
                    {t('tenantManagement.moveInDateLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={formData.moveInDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground ${errors.moveInDate ? "border-red-500" : ""}`}
                  />
                  {errors.moveInDate && <p className="text-red-500 text-xs mt-1">{errors.moveInDate}</p>}
                </div>
              </div>

              {/* Personal Details */}
              <h3 className="font-medium text-foreground mt-2">Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground font-medium">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground font-medium">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-foreground font-medium">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="e.g., Student, Employee"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-foreground font-medium">Native Place</label>
                  <input
                    type="text"
                    name="nativePlace"
                    value={formData.nativePlace}
                    onChange={handleInputChange}
                    placeholder="e.g., Chennai"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-foreground font-medium">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground font-medium">Expected Duration</label>
                  <input
                    type="text"
                    name="expectedDuration"
                    value={formData.expectedDuration}
                    onChange={handleInputChange}
                    placeholder="e.g., 6 months"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="text-foreground font-medium">Medical Condition / Allergies</label>
                <textarea
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleInputChange}
                  placeholder="Any medical conditions or allergies..."
                  rows="2"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Emergency Contact - Optional */}
              <h3 className="font-medium text-foreground mt-2">{t('tenantManagement.emergencyContact')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="emergencyContactName"
                  placeholder={t('tenantManagement.contactName')}
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  placeholder={t('tenantManagement.relationship')}
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <input
                type="tel"
                name="emergencyContactPhone"
                placeholder={t('tenantManagement.emergencyContactPhone')}
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
              />

              {/* Security Deposit */}
              <div>
                <label className="text-foreground font-medium">
                  {t('tenantManagement.securityDeposit')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="securityDeposit"
                  value={formData.securityDeposit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground ${errors.securityDeposit ? "border-red-500" : ""}`}
                />
                {errors.securityDeposit && <p className="text-red-500 text-xs mt-1">{errors.securityDeposit}</p>}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTenant ? 'Update Tenant' : t('tenantManagement.addTenantButton')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingTenant(null); resetForm(); }}
                  className="flex-1 bg-card text-foreground py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {t('tenantManagement.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Send SMS to Selected Tenants</h2>
              <button onClick={() => setShowSMSModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-muted-foreground">Selected tenants: {selectedTenants.length}</p>
              <div>
                <label className="text-foreground font-medium">Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter your message..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSendSMS}
                  disabled={sendingSMS || !smsMessage.trim()}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sendingSMS ? 'Sending...' : 'Send SMS'}
                </button>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="flex-1 bg-card text-foreground py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;





