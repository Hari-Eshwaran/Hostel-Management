import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Pencil, Trash2, X, Building2 } from 'lucide-react';
import apiFetch from '@/lib/apiClient';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [unassignedHostels, setUnassignedHostels] = useState([]);
  const [allHostels, setAllHostels] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', hostelId: '' });
  const [formLoading, setFormLoading] = useState(false);

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

  const loadUnassignedHostels = async () => {
    try {
      const data = await apiFetch('/superadmin/hostels-unassigned');
      setUnassignedHostels(data.hostels || []);
    } catch (err) {
      console.error('Failed to load unassigned hostels:', err);
    }
  };

  const loadAllHostels = async () => {
    try {
      const data = await apiFetch('/superadmin/hostels?limit=100');
      setAllHostels(data.hostels || []);
    } catch (err) {
      console.error('Failed to load hostels:', err);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreateOpen = () => {
    setFormData({ name: '', email: '', phone: '', password: '', hostelId: '' });
    loadUnassignedHostels();
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      return alert('All fields are required');
    }
    setFormLoading(true);
    try {
      await apiFetch('/superadmin/admins', {
        method: 'POST',
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          hostelId: formData.hostelId || undefined,
        },
      });
      alert('Admin created successfully!');
      setShowCreateModal(false);
      loadAdmins();
    } catch (err) {
      alert(err.message || 'Failed to create admin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: '',
      hostelId: admin.propertyId?._id || admin.propertyId || '',
    });
    loadUnassignedHostels();
    loadAllHostels();
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiFetch(`/superadmin/admins/${editingAdmin._id}`, {
        method: 'PUT',
        body: {
          name: formData.name,
          phone: formData.phone,
          hostelId: formData.hostelId || null,
        },
      });
      alert('Admin updated successfully!');
      setShowEditModal(false);
      setEditingAdmin(null);
      loadAdmins();
    } catch (err) {
      alert(err.message || 'Failed to update admin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin "${admin.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/superadmin/admins/${admin._id}`, { method: 'DELETE' });
      alert('Admin deleted.');
      loadAdmins();
    } catch (err) {
      alert(err.message || 'Failed to delete admin');
    }
  };

  // Build available hostels for the edit dropdown: unassigned + the current admin's hostel
  const getEditHostelOptions = () => {
    const options = [...unassignedHostels];
    if (editingAdmin?.propertyId) {
      const currentHostelId = editingAdmin.propertyId._id || editingAdmin.propertyId;
      const currentHostel = allHostels.find((h) => h._id === currentHostelId);
      if (currentHostel && !options.find((h) => h._id === currentHostelId)) {
        options.unshift({ _id: currentHostelId, name: currentHostel.name, address: currentHostel.address });
      }
    }
    return options;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-500" /> Admin Management
          </h1>
          <p className="text-muted-foreground">Create, manage and assign admins to hostels. One admin per hostel.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Admin
        </button>
      </div>

      <div className="bg-card rounded-xl shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Assigned Hostel</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Org Code</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No admins found. Click "Add Admin" to create one.</td></tr>
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
                <td className="p-3">
                  {admin.propertyId ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-foreground font-medium">{admin.propertyId.name || 'Assigned'}</span>
                    </div>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">Not assigned</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{admin.organizationalCode || '—'}</td>
                <td className="p-3 text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditOpen(admin)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Create New Admin</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Assign to Hostel <span className="text-xs text-muted-foreground">(optional)</span></label>
                <select
                  value={formData.hostelId}
                  onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— No hostel (assign later) —</option>
                  {unassignedHostels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name} — {h.address}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Only hostels without an admin are shown.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {formLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Edit Admin</h2>
              <button onClick={() => { setShowEditModal(false); setEditingAdmin(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Assign to Hostel</label>
                <select
                  value={formData.hostelId}
                  onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Unassign from hostel —</option>
                  {getEditHostelOptions().map((h) => (
                    <option key={h._id} value={h._id}>{h.name} — {h.address || ''}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">One admin per hostel. Only unassigned hostels + current hostel shown.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingAdmin(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
