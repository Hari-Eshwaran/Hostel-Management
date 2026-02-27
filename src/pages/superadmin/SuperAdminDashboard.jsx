import React, { useState, useEffect } from 'react';
import { Building2, Users, CheckCircle, Clock, XCircle, DoorOpen } from 'lucide-react';
import apiFetch from '@/lib/apiClient';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiFetch('/superadmin/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-red-500">Failed to load platform stats.</p>;

  const cards = [
    { label: 'Total Hostels', value: stats.totalHostels, icon: Building2, color: 'bg-blue-500' },
    { label: 'Verified Hostels', value: stats.verifiedHostels, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pending Verification', value: stats.pendingHostels, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Rejected', value: stats.rejectedHostels, icon: XCircle, color: 'bg-red-500' },
    { label: 'Total Admins', value: stats.totalAdmins, icon: Users, color: 'bg-indigo-500' },
    { label: 'Total Tenants', value: stats.totalTenants, icon: Users, color: 'bg-purple-500' },
    { label: 'Active Tenants', value: stats.activeTenants, icon: Users, color: 'bg-emerald-500' },
    { label: 'Total Rooms', value: stats.totalRooms, icon: DoorOpen, color: 'bg-cyan-500' },
    { label: 'Available Rooms', value: stats.availableRooms, icon: DoorOpen, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor all hostels, admins and tenants from here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl shadow p-5 flex items-center gap-4 border border-border">
            <div className={`${card.color} text-white rounded-lg p-3`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
