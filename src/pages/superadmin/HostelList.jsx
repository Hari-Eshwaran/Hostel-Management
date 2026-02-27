import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Trash2, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '@/lib/apiClient';
import Pagination from '@/components/Pagination';

const HostelList = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const loadHostels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, limit: 12 });
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const data = await apiFetch(`/superadmin/hostels?${params}`);
      setHostels(data.hostels || []);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHostels(); }, [currentPage, filterStatus]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadHostels();
  };

  const handleVerify = async (id, action) => {
    const reason = action === 'reject' ? window.prompt('Rejection reason:') : undefined;
    if (action === 'reject' && reason === null) return;

    try {
      await apiFetch(`/superadmin/hostels/${id}/verify`, {
        method: 'PUT',
        body: { action, reason },
      });
      alert(`Hostel ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
      loadHostels();
    } catch (err) {
      alert(err.message || `Failed to ${action} hostel`);
    }
  };

  const handleDelete = async (hostel) => {
    if (!window.confirm(`Delete "${hostel.name}" and ALL its rooms/tenants? This cannot be undone.`)) return;
    try {
      await apiFetch(`/superadmin/hostels/${hostel._id}`, { method: 'DELETE' });
      alert('Hostel deleted.');
      loadHostels();
    } catch (err) {
      alert(err.message || 'Failed to delete hostel');
    }
  };

  const statusBadge = (status) => {
    const map = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-muted text-muted-foreground'}`;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hostels</h1>
          <p className="text-muted-foreground">Manage all registered hostels across the platform.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-card rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, address, owner, org code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
          />
        </form>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Hostel Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 py-8">{error}</p>
      ) : hostels.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No hostels found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="bg-card rounded-xl shadow border border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-foreground text-lg truncate">{hostel.name}</h3>
                  </div>
                  <span className={statusBadge(hostel.verificationStatus)}>
                    {hostel.verificationStatus}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-1 truncate">{hostel.address}</p>
                {hostel.owner && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Owner: <span className="text-foreground">{hostel.owner.name}</span> — {hostel.owner.email}
                  </p>
                )}
                {hostel.organizationalCode && (
                  <p className="text-xs text-muted-foreground font-mono mb-3">Code: {hostel.organizationalCode}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center bg-background rounded-lg p-2 mb-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">{hostel.stats?.totalTenants || 0}</p>
                    <p className="text-xs text-muted-foreground">Tenants</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{hostel.stats?.totalRooms || 0}</p>
                    <p className="text-xs text-muted-foreground">Rooms</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{hostel.stats?.pendingTenants || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/superadmin/hostels/${hostel._id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {hostel.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(hostel._id, 'verify')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Verify"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleVerify(hostel._id, 'reject')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(hostel)}
                    className="p-2 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default HostelList;
