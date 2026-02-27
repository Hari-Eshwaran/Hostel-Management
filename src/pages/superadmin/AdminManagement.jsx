import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import apiFetch from '@/lib/apiClient';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/superadmin/admins');
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleRoleChange = async (adminId, newRole) => {
    try {
      await apiFetch(`/superadmin/admins/${adminId}/role`, {
        method: 'PUT',
        body: { role: newRole },
      });
      alert('Role updated successfully!');
      loadAdmins();
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-500" /> Admin Management
        </h1>
        <p className="text-muted-foreground">View and manage all hostel administrators.</p>
      </div>

      <div className="bg-card rounded-xl shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Verification</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No admins found.</td></tr>
            ) : admins.map((admin) => (
              <tr key={admin._id} className="border-b border-border hover:bg-muted/20">
                <td className="p-3 text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {admin.name}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{admin.email}</td>
                <td className="p-3 text-muted-foreground">{admin.phone}</td>
                <td className="p-3 text-muted-foreground">
                  {admin.propertyId ? (
                    <span className="text-foreground">{admin.propertyId.name}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    admin.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    admin.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {admin.verificationStatus || 'unverified'}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value="admin"
                    onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                    className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManagement;
