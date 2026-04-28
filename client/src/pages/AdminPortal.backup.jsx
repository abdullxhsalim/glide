import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Users, Car, CalendarCheck2, Clock3, CheckCircle2, XCircle, LogOut, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext';

const AdminPortal = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('analytics');
  const [overview, setOverview] = useState({
    summary: {
      totalUsers: 0,
      totalHoppers: 0,
      totalSharers: 0,
      pendingVehicleVerifications: 0,
      totalRidePosts: 0,
      totalMatchmakingRequests: 0
    },
    hoppers: [],
    sharers: [],
    pendingVehicleVerifications: [],
    rides: [],
    matchmakingRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState('');
  const [managingUserId, setManagingUserId] = useState('');
  const [expandedRideId, setExpandedRideId] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    studentId: '',
    role: 'rider',
    contactNumber: '',
    isVerified: false
  });

  const parseResponse = async (response, fallbackMessage) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const rawText = await response.text();
      throw new Error(
        `Server returned an unexpected response format (${response.status}). ${rawText.slice(0, 120)}`
      );
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || fallbackMessage);
    }

    return data;
  };

  const fetchOverview = useCallback(async () => {
    if (!user?.token || user.role !== 'admin') {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/admin/operations-overview', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
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
    if (!user?.token) {
      return;
    }

    setReviewingId(targetUserId);
    setError('');

    try {
      const response = await fetch(`/api/users/admin/vehicle-verifications/${targetUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ action })
      });

      await parseResponse(response, 'Unable to review vehicle verification request');
      await fetchOverview();
    } catch (err) {
      setError(err.message || 'Unable to review vehicle verification request');
    } finally {
      setReviewingId('');
    }
  };

  const handleEditUser = async (person) => {
    setEditingUser(person);
    setEditForm({
      name: person.name || '',
      email: person.email || '',
      studentId: person.studentId || '',
      role: person.role || 'rider',
      contactNumber: person.contactNumber || '',
      isVerified: Boolean(person.isVerified)
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      email: '',
      studentId: '',
      role: 'rider',
      contactNumber: '',
      isVerified: false
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    if (!user?.token || !editingUser?._id) {
      return;
    }

    setManagingUserId(editingUser._id);
    setError('');

    try {
      const response = await fetch(`/api/users/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          studentId: editForm.studentId,
          role: editForm.role,
          contactNumber: editForm.contactNumber,
          isVerified: editForm.isVerified
        })
      });

      await parseResponse(response, 'Unable to update user');
      closeEditModal();
      await fetchOverview();
    } catch (err) {
      setError(err.message || 'Unable to update user');
    } finally {
      setManagingUserId('');
    }
  };

  const handleDeleteUser = async (person) => {
    if (!user?.token) {
      return;
    }

    const actionText = person.isActive === false ? 'Enable' : 'Disable';
    const approved = window.confirm(`${actionText} user ${person.name}? This is a soft toggle.`);
    if (!approved) {
      return;
    }

    setManagingUserId(person._id);
    setError('');

    try {
      const response = await fetch(`/api/users/admin/users/${person._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      await parseResponse(response, `Unable to ${actionText.toLowerCase()} user`);
      await fetchOverview();
    } catch (err) {
      setError(err.message || `Unable to ${actionText.toLowerCase()} user`);
    } finally {
      setManagingUserId('');
    }
  };

  const renderUserActions = (person) => {
    const isInactive = person.isActive === false;
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleEditUser(person)}
          disabled={managingUserId === person._id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#FCD34D] text-sm font-medium transition-colors disabled:opacity-60"
        >
          Edit User
        </button>
        <button
          type="button"
          onClick={() => handleDeleteUser(person)}
          disabled={managingUserId === person._id}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 ${
            isInactive 
              ? 'border-[#10B981]/40 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#6EE7B7]' 
              : 'border-[#EF4444]/40 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#FCA5A5]'
          }`}
        >
          {isInactive ? 'Enable User' : 'Disable User'}
        </button>
      </div>
    );
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleString();
  };

  const formatRoleLabel = (role) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (normalizedRole === 'driver') return 'Sharers';
    if (normalizedRole === 'rider') return 'Hoppers';
    if (normalizedRole === 'admin') return 'Admin';
    return role || 'N/A';
  };

  const summaryCards = [
    {
      key: 'analytics',
      label: 'Analytics Overview',
      value: 'Data & Stats',
      icon: BarChart3,
      colorClass: 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
    },
    {
      key: 'totalUsers',
      label: 'Total Users',
      value: overview.summary.totalUsers,
      icon: Users,
      colorClass: 'bg-[#10B981]/20 text-[#10B981]'
    },
    {
      key: 'sharers',
      label: 'Sharers',
      value: overview.summary.totalSharers,
      icon: Car,
      colorClass: 'bg-[#3B82F6]/20 text-[#3B82F6]'
    },
    {
      key: 'hoppers',
      label: 'Hoppers',
      value: overview.summary.totalHoppers,
      icon: CalendarCheck2,
      colorClass: 'bg-[#F59E0B]/20 text-[#F59E0B]'
    },
    {
      key: 'pendingVehicleVerifications',
      label: 'Pending Verifications',
      value: overview.summary.pendingVehicleVerifications,
      icon: Clock3,
      colorClass: 'bg-[#EF4444]/20 text-[#EF4444]'
    },
    {
      key: 'rides',
      label: 'Ride Posts',
      value: overview.summary.totalRidePosts,
      icon: Car,
      colorClass: 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
    },
    {
      key: 'matchmakingRequests',
      label: 'Matchmaking Requests',
      value: overview.summary.totalMatchmakingRequests,
      icon: Users,
      colorClass: 'bg-[#22C55E]/20 text-[#22C55E]'
    }
  ];

  const allUsers = [...(overview.sharers || []), ...(overview.hoppers || [])];

  const pieData = useMemo(() => [
    { name: 'Hoppers', value: overview.summary.totalHoppers || 0, color: '#F59E0B' },
    { name: 'Sharers', value: overview.summary.totalSharers || 0, color: '#3B82F6' }
  ], [overview.summary]);

  const activityData = useMemo(() => [
    { name: 'Ride Posts', count: overview.summary.totalRidePosts || 0 },
    { name: 'Match Requests', count: overview.summary.totalMatchmakingRequests || 0 },
    { name: 'Pending Verification', count: overview.summary.pendingVehicleVerifications || 0 }
  ], [overview.summary]);

  const timeSeriesData = useMemo(() => {
    const datesMap = {};
    const processItems = (items, key) => {
      (items || []).forEach(item => {
        const dateStr = new Date(item.createdAt || item.departureTime || item.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!datesMap[dateStr]) datesMap[dateStr] = { date: dateStr, rides: 0, requests: 0 };
        datesMap[dateStr][key] += 1;
      });
    };
    processItems(overview.rides, 'rides');
    processItems(overview.matchmakingRequests, 'requests');
    
    return Object.values(datesMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14); // last 14 days
  }, [overview.rides, overview.matchmakingRequests]);

  const ridesStatusData = useMemo(() => {
    const statusCounts = (overview.rides || []).reduce((acc, ride) => {
      acc[ride.status] = (acc[ride.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: 'Scheduled', value: statusCounts['scheduled'] || 0, color: '#3B82F6' },
      { name: 'In-Progress', value: statusCounts['in-progress'] || 0, color: '#F59E0B' },
      { name: 'Completed', value: statusCounts['completed'] || 0, color: '#10B981' },
      { name: 'Cancelled', value: statusCounts['cancelled'] || 0, color: '#EF4444' }
    ].filter(d => d.value > 0);
  }, [overview.rides]);

  const requestsStatusData = useMemo(() => {
    const statusCounts = (overview.matchmakingRequests || []).reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: 'Pending', value: statusCounts['pending'] || 0, color: '#F59E0B' },
      { name: 'Matched', value: statusCounts['matched'] || 0, color: '#10B981' },
      { name: 'Expired', value: statusCounts['expired'] || 0, color: '#64748B' },
      { name: 'Cancelled', value: statusCounts['cancelled'] || 0, color: '#EF4444' }
    ].filter(d => d.value > 0);
  }, [overview.matchmakingRequests]);

  const userVerificationData = useMemo(() => {
    const verified = allUsers.filter(u => u.isVerified).length;
    const unverified = allUsers.length - verified;
    return [
      { name: 'Verified', value: verified, color: '#10B981' },
      { name: 'Unverified', value: unverified, color: '#64748B' }
    ];
  }, [allUsers]);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#0F172A]/70 border border-[#334155] rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D] text-xs font-semibold uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white">Welcome, {user.name}</h1>
              <p className="mt-2 text-[#94A3B8]">
                You are signed in as an administrator and can oversee core platform operations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              const isActive = activeView === card.key;

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setActiveView(card.key)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    isActive
                      ? 'border-[#F59E0B] bg-[#1E293B] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]'
                      : 'border-[#334155] bg-[#1E293B]/60 hover:border-[#475569]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${card.colorClass} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-semibold text-white">{card.label}</h2>
                  <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{card.value}</p>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="mt-8 rounded-2xl border border-[#334155] bg-[#1E293B]/50 p-5 text-[#94A3B8]">
              Loading admin operations data...
            </div>
          )}

          {error && !loading && (
            <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mt-8 space-y-6">
              {activeView === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Distribution Pie Chart */}
                    <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                      <h2 className="text-lg font-semibold text-white mb-4">User Roles Distribution</h2>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
                              itemStyle={{ color: '#F8FAFC' }}
                            />
                            <Legend wrapperStyle={{ color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Platform Activity Bar Chart */}
                    <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                      <h2 className="text-lg font-semibold text-white mb-4">Platform Activity Overview</h2>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#94A3B8" fontSize={12} tickMargin={10} allowDecimals={false} />
                            <RechartsTooltip
                              cursor={{ fill: '#334155', opacity: 0.4 }}
                              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
                            />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* System Growth Line Chart */}
                  <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Rides & Matches over Time (Last 14 Days)</h2>
                    <div className="h-[350px] w-full">
                      {timeSeriesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#94A3B8" fontSize={12} tickMargin={10} allowDecimals={false} />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="rides" name="Rides Posted" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="requests" name="Match Requests" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#94A3B8]">
                          No recent rides or match requests to display.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'pendingVehicleVerifications' && (
              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Pending Vehicle Verification Requests</h2>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {overview.pendingVehicleVerifications.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No pending verification requests.</p>
                  ) : (
                    overview.pendingVehicleVerifications.map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-white font-semibold">{person.name}</p>
                          {renderUserActions(person)}
                        </div>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId}</p>
                        <p className="text-sm text-[#94A3B8]">Role: {formatRoleLabel(person.role)}</p>
                        <p className="text-sm text-[#94A3B8]">Vehicle: {person.vehicle?.make} {person.vehicle?.model} ({person.vehicle?.licensePlate})</p>
                        <p className="text-sm text-[#94A3B8]">Requested: {formatDate(person.vehicleVerificationRequestedAt)}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReviewVehicle(person._id, 'approve')}
                            disabled={reviewingId === person._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewVehicle(person._id, 'reject')}
                            disabled={reviewingId === person._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}

              {activeView === 'rides' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Rides Breakdown */}
                  <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Rides by Status</h2>
                    <div className="h-[250px] w-full">
                      {ridesStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={ridesStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                              {ridesStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                            <Legend wrapperStyle={{ color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#94A3B8]">No ride data available.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                  <h2 className="text-xl font-semibold text-white mb-4">Registered Ride Posts ({overview.rides.length})</h2>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {overview.rides.length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">No ride posts found.</p>
                    ) : (
                      overview.rides.map((ride) => (
                      <div key={ride._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">Sharer: {ride.driver?.name || 'Unknown'}</p>
                        <p className="text-sm text-[#94A3B8]">From: {ride.origin?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">To: {ride.destination?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Departure: {formatDate(ride.departureTime)}</p>
                        <p className="text-sm text-[#94A3B8]">Seats: {ride.seatsBooked}/{ride.seatsTotal} | Status: {ride.status}</p>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setExpandedRideId((prev) => (prev === ride._id ? '' : ride._id))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#1E293B]/70 hover:bg-[#334155]/60 text-[#E2E8F0] text-sm font-medium transition-colors"
                          >
                            {expandedRideId === ride._id ? 'Hide Hoppers' : 'View Hoppers'}
                          </button>
                        </div>

                        {expandedRideId === ride._id && (
                          <div className="mt-3 rounded-lg border border-[#334155] bg-[#020617]/60 p-3 space-y-2">
                            <p className="text-sm font-semibold text-[#F8FAFC]">Accepted Hoppers</p>
                            {ride.acceptedHoppers?.length ? (
                              ride.acceptedHoppers.map((hopper) => (
                                <div key={hopper._id || `${ride._id}-${hopper.email}`} className="rounded-md border border-[#334155] bg-[#0B1220] p-2">
                                  <p className="text-sm text-white">{hopper.name}</p>
                                  <p className="text-xs text-[#94A3B8]">{hopper.email}</p>
                                  <p className="text-xs text-[#94A3B8]">Student ID: {hopper.studentId || 'N/A'} | Seats: {hopper.seatsBooked || 0}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-[#94A3B8]">No hoppers have accepted this ride yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
              )}

              {activeView === 'matchmakingRequests' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Requests Breakdown */}
                  <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Requests by Status</h2>
                    <div className="h-[250px] w-full">
                      {requestsStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={requestsStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                              {requestsStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                            <Legend wrapperStyle={{ color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#94A3B8]">No requests data available.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                  <h2 className="text-xl font-semibold text-white mb-4">Matchmaking Requests ({overview.matchmakingRequests.length})</h2>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {overview.matchmakingRequests.length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">No matchmaking requests found.</p>
                    ) : (
                      overview.matchmakingRequests.map((request) => (
                      <div key={request._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">Requester: {request.requester?.name || 'Unknown'}</p>
                        <p className="text-sm text-[#94A3B8]">Pickup: {request.pickup?.placeName || request.pickup?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Dropoff: {request.destination?.placeName || request.destination?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Request Time: {formatDate(request.requestedAt || request.createdAt)}</p>
                        <p className="text-sm text-[#94A3B8]">Time Label: {request.requestedTimeLabel} | Status: {request.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
              )}

              {(activeView === 'totalUsers' || activeView === 'sharers' || activeView === 'hoppers') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Verified VS Unverified */}
                  <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Total System Verification Status</h2>
                    <div className="h-[250px] w-full">
                      {userVerificationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={userVerificationData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                              {userVerificationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                            <Legend wrapperStyle={{ color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#94A3B8]">No user data available.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {activeView === 'totalUsers' ? `All Users (${allUsers.length})` : activeView === 'sharers' ? `Sharers (${overview.sharers.length})` : `Hoppers (${overview.hoppers.length})`}
                  </h2>
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {(activeView === 'totalUsers' ? allUsers : activeView === 'sharers' ? overview.sharers : overview.hoppers).length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">No users found for this category.</p>
                    ) : (
                      (activeView === 'totalUsers' ? allUsers : activeView === 'sharers' ? overview.sharers : overview.hoppers).map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-white font-semibold">{person.name}</p>
                          {renderUserActions(person)}
                        </div>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Role: {formatRoleLabel(person.role)}</p>
                        <p className="text-sm text-[#94A3B8]">Verified: {person.isVerified ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-[#94A3B8]">Total Rides: {person.totalRides || 0}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
              )}

              {activeView === 'sharers' && (
              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Sharer Information</h2>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {overview.sharers.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No sharers found.</p>
                  ) : (
                    overview.sharers.map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-white font-semibold">{person.name}</p>
                          {renderUserActions(person)}
                        </div>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId}</p>
                        <p className="text-sm text-[#94A3B8]">Role: {formatRoleLabel(person.role)}</p>
                        <p className="text-sm text-[#94A3B8]">Verified: {person.isVerified ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-[#94A3B8]">Vehicle: {person.vehicle?.make} {person.vehicle?.model} ({person.vehicle?.licensePlate})</p>
                        <p className="text-sm text-[#94A3B8]">Total Rides: {person.totalRides || 0}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#334155] bg-[#0F172A] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-1">Edit User</h2>
            <p className="text-sm text-[#94A3B8] mb-5">Update details for {editingUser.name}</p>

            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#CBD5E1] mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#CBD5E1] mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#CBD5E1] mb-1">Student ID</label>
                  <input
                    name="studentId"
                    type="text"
                    value={editForm.studentId}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#CBD5E1] mb-1">Contact Number</label>
                  <input
                    name="contactNumber"
                    type="text"
                    value={editForm.contactNumber}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#CBD5E1] mb-1">Role</label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="driver">Sharer</option>
                    <option value="rider">Hopper</option>
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-[#CBD5E1] mt-7">
                  <input
                    name="isVerified"
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={handleEditFormChange}
                    className="h-4 w-4 rounded border-[#475569] bg-[#1E293B]"
                  />
                  Verified user
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-lg border border-[#475569] text-[#CBD5E1] hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={managingUserId === editingUser._id}
                  className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium disabled:opacity-60"
                >
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

export default AdminPortal;
