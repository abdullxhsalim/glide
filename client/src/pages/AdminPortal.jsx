import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Users, Car, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AIChatWidget from '../components/AIChatWidget';

// Import our new extracted views
import AdminDashboard from './admin-views/AdminDashboard';
import AdminUsers from './admin-views/AdminUsers';
import AdminRides from './admin-views/AdminRides';

const AdminPortal = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [overview, setOverview] = useState({
    summary: {
      totalUsers: 0, totalHoppers: 0, totalSharers: 0, pendingVehicleVerifications: 0,
      totalRidePosts: 0, totalMatchmakingRequests: 0, totalBookings: 0, acceptedBookings: 0,
      completedBookings: 0, cancelledBookings: 0, paidBookings: 0, grossRevenue: 0,
      paidRevenue: 0, averageTripValue: 0, bookingAcceptanceRate: 0, utilizationRate: 0,
      newUsersLast30Days: 0, newRidesLast30Days: 0, driverVerificationApprovalRate: 0
    },
    analytics: {
      ridesByStatus: {}, bookingsByStatus: {}, vehicleVerificationBreakdown: {},
      usersSeries: [], ridesSeries: [], bookingsSeries: [], peakHours: [], topDrivers: []
    },
    hoppers: [], sharers: [], pendingVehicleVerifications: [], rides: [], matchmakingRequests: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState('');
  const [managingUserId, setManagingUserId] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', studentId: '', role: 'rider', contactNumber: '', isVerified: false
  });

  const parseResponse = async (response, fallbackMessage) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const rawText = await response.text();
      throw new Error(`Server returned an unexpected format (${response.status}). ${rawText.slice(0, 120)}`);
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || fallbackMessage);
    return data;
  };

  const fetchOverview = useCallback(async () => {
    if (!user?.token || user.role !== 'admin') return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users/admin/operations-overview', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await parseResponse(response, 'Failed to load admin operations overview');
      setOverview(data);
    } catch (err) {
      setError(err.message || 'Unable to load admin information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleReviewVehicle = async (targetUserId, action) => {
    if (!user?.token) return;
    setReviewingId(targetUserId);
    setError('');
    try {
      const response = await fetch(`/api/users/admin/vehicle-verifications/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ action })
      });
      await parseResponse(response, 'Unable to review vehicle verification request');
      await fetchOverview();
    } catch (err) { setError(err.message); } finally { setReviewingId(''); }
  };

  const handleEditUser = async (person) => {
    setEditingUser(person);
    setEditForm({
      name: person.name || '', email: person.email || '', studentId: person.studentId || '',
      role: person.role || 'rider', contactNumber: person.contactNumber || '', isVerified: Boolean(person.isVerified)
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', studentId: '', role: 'rider', contactNumber: '', isVerified: false });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token || !editingUser?._id) return;
    setManagingUserId(editingUser._id);
    setError('');
    try {
      const response = await fetch(`/api/users/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(editForm)
      });
      await parseResponse(response, 'Unable to update user');
      closeEditModal();
      await fetchOverview();
    } catch (err) { setError(err.message); } finally { setManagingUserId(''); }
  };

  const handleDeleteUser = async (person) => {
    if (!user?.token) return;
    const approved = window.confirm(`Soft delete user ${person.name}? They will be marked as an unverified rider.`);
    if (!approved) return;
    setManagingUserId(person._id);
    setError('');
    try {
      const response = await fetch(`/api/users/admin/users/${person._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      await parseResponse(response, 'Unable to soft delete user');
      await fetchOverview();
    } catch (err) { setError(err.message); } finally { setManagingUserId(''); }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] pt-16 bg-[#0F172A] flex text-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-[#334155] bg-[#1E293B]/80 flex flex-col backdrop-blur-lg fixed h-full z-20">
        <div className="p-6 border-b border-[#334155]">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D] text-xs font-semibold uppercase tracking-wide w-fit">
              <ShieldCheck className="w-4 h-4" /> Glide Admin
           </div>
           <p className="mt-4 text-sm text-[#94A3B8]">Logged in as</p>
           <p className="font-bold truncate text-white">{user.name}</p>
        </div>
        
        <div className="flex-1 p-4 space-y-2">
            <SidebarItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem active={activeView === 'users'} onClick={() => setActiveView('users')} icon={Users} label="Users & Verifications" />
            <SidebarItem active={activeView === 'rides'} onClick={() => setActiveView('rides')} icon={Car} label="Rides & Matches" />
        </div>

        <div className="p-4 border-t border-[#334155]">
           <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors font-medium">
             <LogOut className="w-5 h-5" /> Logout
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8 relative flex flex-col overflow-y-auto">
        {loading ? (
             <div className="flex flex-col items-center justify-center flex-1 py-12">
               <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
               <p className="mt-4 text-[#94A3B8] font-medium animate-pulse">Loading core metrics...</p>
             </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 bg-[#EF4444]/10 border border-[#EF4444]/50 text-[#FCA5A5] px-4 py-3 rounded-xl flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="font-semibold flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Error</span>
                    <span className="text-sm">{error}</span>
                 </div>
                 <button onClick={() => setError('')} className="p-1 hover:bg-[#EF4444]/20 rounded-md transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>
            )}

            {/* View Switching */}
            {activeView === 'dashboard' && <AdminDashboard overview={overview} />}
            {activeView === 'users' && <AdminUsers overview={overview} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onReviewVehicle={handleReviewVehicle} managingUserId={managingUserId} reviewingId={reviewingId} />}
            {activeView === 'rides' && <AdminRides overview={overview} />}
            <AIChatWidget />
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 w-full max-w-md shadow-2xl relative transform transition-all">
            <h3 className="text-xl font-bold text-white mb-4">Edit User Account</h3>
            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Name</label>
                <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} required className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Role</label>
                <select name="role" value={editForm.role} onChange={handleEditFormChange} className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981]">
                  <option value="rider">Hopper (Rider)</option>
                  <option value="driver">Sharer (Driver)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="pt-2 border-t border-[#334155] flex justify-end gap-3">
                <button type="button" onClick={closeEditModal} className="px-5 py-2.5 rounded-xl font-medium text-[#94A3B8] hover:text-white hover:bg-[#334155]/50 transition-colors">Cancel</button>
                <button type="submit" disabled={managingUserId === editingUser._id} className="px-5 py-2.5 rounded-xl font-medium bg-[#10B981] hover:bg-[#059669] text-white transition-colors flex items-center disabled:opacity-50">
                  {managingUserId === editingUser._id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all font-medium ${
      active ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20' : 'text-[#94A3B8] hover:bg-[#334155]/50 hover:text-white'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#64748B]'}`} />
    {label}
  </button>
);

export default AdminPortal;
