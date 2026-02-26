import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiFetch from '@/lib/apiClient';

const TenantOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    aadharNumber: '',
    roomAssignment: '',
    moveInDate: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    nativePlace: '',
    bloodGroup: '',
    medicalCondition: '',
    expectedDuration: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    securityDeposit: '',
    currentRent: '',
    dueDate: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAvailableRooms();
  }, []);

  const loadAvailableRooms = async () => {
    try {
      const response = await apiFetch('/rooms');
      setRooms((response.rooms || []).filter(room => room.occupancy < room.capacity));
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.aadharNumber.trim()) newErrors.aadharNumber = 'Aadhaar Number is required';
    if (!formData.roomAssignment) newErrors.roomAssignment = 'Room selection is required';
    if (!formData.moveInDate) newErrors.moveInDate = 'Move-in date is required';
    if (!formData.securityDeposit) newErrors.securityDeposit = 'Security deposit is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    // Aadhaar validation (12 digits)
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhaar Number must be 12 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const tenantData = {
        aadharNumber: formData.aadharNumber,
        room: formData.roomAssignment,
        moveInDate: formData.moveInDate,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        termsAccepted: formData.termsAccepted,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        securityDeposit: parseFloat(formData.securityDeposit),
      };
      // Optional fields
      if (formData.occupation) tenantData.occupation = formData.occupation;
      if (formData.nativePlace) tenantData.nativePlace = formData.nativePlace;
      if (formData.bloodGroup) tenantData.bloodGroup = formData.bloodGroup;
      if (formData.medicalCondition) tenantData.medicalCondition = formData.medicalCondition;
      if (formData.expectedDuration) tenantData.expectedDuration = formData.expectedDuration;

      await apiFetch('/tenants/onboard', {
        method: 'POST',
        body: tenantData
      });

      alert('Onboarding submitted! Your profile is pending approval by the admin.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert(error.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">Please provide the following information to complete your tenant registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Aadhaar Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                maxLength="12"
                placeholder="Enter 12-digit Aadhaar number"
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.aadharNumber ? 'border-red-500' : 'border-border'}`}
                required
              />
              {errors.aadharNumber && <p className="text-red-500 text-xs mt-1">{errors.aadharNumber}</p>}
            </div>

            {/* Personal Information Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dateOfBirth ? 'border-red-500' : 'border-border'}`}
                    required
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.gender ? 'border-red-500' : 'border-border'}`}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="e.g., Student, Employee"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Native Place */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Native Place
                  </label>
                  <input
                    type="text"
                    name="nativePlace"
                    value={formData.nativePlace}
                    onChange={handleInputChange}
                    placeholder="e.g., Chennai, Bangalore"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select blood group</option>
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

                {/* Expected Duration */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Duration of Stay
                  </label>
                  <input
                    type="text"
                    name="expectedDuration"
                    value={formData.expectedDuration}
                    onChange={handleInputChange}
                    placeholder="e.g., 6 months, 1 year"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Medical Condition */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Medical Condition / Allergies
                </label>
                <textarea
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleInputChange}
                  placeholder="Any medical conditions, allergies, or special requirements..."
                  rows="2"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Room Assignment */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Room Assignment <span className="text-red-500">*</span>
              </label>
              <select
                name="roomAssignment"
                value={formData.roomAssignment}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.roomAssignment ? 'border-red-500' : 'border-border'}`}
                required
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>
                    Room {room.number} - ₹{room.rent}/month ({room.type})
                  </option>
                ))}
              </select>
              {errors.roomAssignment && <p className="text-red-500 text-xs mt-1">{errors.roomAssignment}</p>}
            </div>

            {/* Move-in Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Move-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.moveInDate ? 'border-red-500' : 'border-border'}`}
                required
              />
              {errors.moveInDate && <p className="text-red-500 text-xs mt-1">{errors.moveInDate}</p>}
            </div>

            {/* Current Rent */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Rent (₹)
              </label>
              <input
                type="number"
                name="currentRent"
                value={formData.currentRent}
                onChange={handleInputChange}
                placeholder="Enter monthly rent amount"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.currentRent ? 'border-red-500' : 'border-border'}`}
              />
              {errors.currentRent && <p className="text-red-500 text-xs mt-1">{errors.currentRent}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rent Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dueDate ? 'border-red-500' : 'border-border'}`}
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Security Deposit (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleInputChange}
                placeholder="Enter security deposit amount"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.securityDeposit ? 'border-red-500' : 'border-border'}`}
                required
              />
              {errors.securityDeposit && <p className="text-red-500 text-xs mt-1">{errors.securityDeposit}</p>}
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Emergency Contact (Optional)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    placeholder="e.g., Parent, Sibling"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  placeholder="Emergency contact phone number"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-t pt-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  id="termsAccepted"
                />
                <label htmlFor="termsAccepted" className="text-sm text-foreground">
                  I accept the <span className="text-blue-600 font-medium">Terms and Conditions</span> and the hostel rules. I understand that my registration is subject to admin approval and that I must comply with all hostel regulations.
                  <span className="text-red-500"> *</span>
                </label>
              </div>
              {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">Your profile will be reviewed and approved by the hostel admin.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantOnboarding;