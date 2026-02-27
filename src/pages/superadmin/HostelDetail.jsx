import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, DoorOpen, CheckCircle, XCircle, Shield } from 'lucide-react';
import apiFetch from '@/lib/apiClient';

const HostelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tenants');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/superadmin/hostels/${id}`);
        setData(res);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to load hostel');
        navigate('/superadmin/hostels');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleVerify = async (action) => {
    const reason = action === 'reject' ? window.prompt('Rejection reason:') : undefined;
    if (action === 'reject' && reason === null) return;
    try {
      await apiFetch(`/superadmin/hostels/${id}/verify`, {
        method: 'PUT',
        body: { action, reason },
      });
      alert(`Hostel ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
      const res = await apiFetch(`/superadmin/hostels/${id}`);
      setData(res);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const { hostel, tenants, rooms, admins } = data;

  const statusColor = {
    verified: 'text-green-600 bg-green-100',
    pending: 'text-yellow-700 bg-yellow-100',
    under_review: 'text-blue-600 bg-blue-100',
    rejected: 'text-red-600 bg-red-100',
  };

  const tabs = [
    { key: 'tenants', label: `Tenants (${tenants.length})` },
    { key: 'rooms', label: `Rooms (${rooms.length})` },
    { key: 'admins', label: `Staff (${admins.length})` },
    { key: 'documents', label: 'Documents' },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Back button */}
      <button onClick={() => navigate('/superadmin/hostels')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Hostels
      </button>

      {/* Header */}
      <div className="bg-card rounded-xl shadow border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold text-foreground">{hostel.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[hostel.verificationStatus] || ''}`}>
                {hostel.verificationStatus}
              </span>
            </div>
            <p className="text-muted-foreground">{hostel.address}</p>
            {hostel.organizationalCode && (
              <p className="text-sm text-muted-foreground font-mono mt-1">Org Code: {hostel.organizationalCode}</p>
            )}
          </div>
          {hostel.verificationStatus === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => handleVerify('verify')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle className="h-4 w-4" /> Verify
              </button>
              <button onClick={() => handleVerify('reject')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          )}
        </div>

        {/* Owner Info */}
        {hostel.owner && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{hostel.owner.name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{hostel.owner.email}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{hostel.owner.phone}</span></div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-background rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{tenants.length}</p>
            <p className="text-xs text-muted-foreground">Tenants</p>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <DoorOpen className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{rooms.length}</p>
            <p className="text-xs text-muted-foreground">Rooms</p>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{tenants.filter(t => t.approvalStatus === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <Shield className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{admins.length}</p>
            <p className="text-xs text-muted-foreground">Staff</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-xl shadow border border-border">
        {activeTab === 'tenants' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Room</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No tenants yet.</td></tr>
                ) : tenants.map((t) => (
                  <tr key={t._id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 text-foreground font-medium">{t.firstName} {t.lastName}</td>
                    <td className="p-3 text-muted-foreground">{t.email}</td>
                    <td className="p-3 text-muted-foreground">{t.phone}</td>
                    <td className="p-3 text-muted-foreground">{t.room?.number || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.active ? 'bg-green-100 text-green-800' :
                        t.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t.active ? 'Active' : t.approvalStatus === 'pending' ? 'Pending' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Room No</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Rent</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Occupancy</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No rooms yet.</td></tr>
                ) : rooms.map((r) => (
                  <tr key={r._id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 text-foreground font-medium">{r.number}</td>
                    <td className="p-3 text-muted-foreground capitalize">{r.type}</td>
                    <td className="p-3 text-muted-foreground">₹{r.rent}</td>
                    <td className="p-3 text-muted-foreground">{r.occupancy}/{r.capacity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'available' ? 'bg-green-100 text-green-800' :
                        r.status === 'occupied' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No staff assigned.</td></tr>
                ) : admins.map((a) => (
                  <tr key={a._id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 text-foreground font-medium">{a.name}</td>
                    <td className="p-3 text-muted-foreground">{a.email}</td>
                    <td className="p-3 text-muted-foreground">{a.phone}</td>
                    <td className="p-3 capitalize text-muted-foreground">{a.role}</td>
                    <td className="p-3 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <h3 className="font-medium text-foreground mb-4">Verification Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'tradeLicense', label: 'Trade License' },
                { key: 'fireSafetyCertificate', label: 'Fire Safety Certificate' },
                { key: 'noc', label: 'NOC' },
                { key: 'proofOfAddress', label: 'Proof of Address' },
                { key: 'gstCertificate', label: 'GST Certificate' },
                { key: 'buildingOccupancyCertificate', label: 'Building Occupancy Certificate' },
                { key: 'leaseAgreement', label: 'Lease Agreement' },
                { key: 'insuranceCertificate', label: 'Insurance Certificate' },
                { key: 'healthSanitationCertificate', label: 'Health & Sanitation Certificate' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground">{label}</span>
                  {hostel[key] ? (
                    <a href={hostel[key]} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelDetail;
