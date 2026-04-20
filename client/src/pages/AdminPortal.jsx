import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldCheck, Users, Car, CalendarCheck2, Clock3, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminPortal = () => {
  const { user, logout } = useAuth();
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

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleString();
  };

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
              <Link
                to="/dash"
                className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-medium"
              >
                Open User Dashboard
              </Link>
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
            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Total Users</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.totalUsers}</p>
            </div>

            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center mb-3">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Sharers</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.totalSharers}</p>
            </div>

            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center mb-3">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Hoppers</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.totalHoppers}</p>
            </div>

            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center mb-3">
                <Clock3 className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Pending Verifications</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.pendingVehicleVerifications}</p>
            </div>

            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-3">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Ride Posts</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.totalRidePosts}</p>
            </div>

            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-white">Matchmaking Requests</h2>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{overview.summary.totalMatchmakingRequests}</p>
            </div>
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
              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Pending Vehicle Verification Requests</h2>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {overview.pendingVehicleVerifications.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No pending verification requests.</p>
                  ) : (
                    overview.pendingVehicleVerifications.map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">{person.name}</p>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId}</p>
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

              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Registered Ride Posts</h2>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {overview.rides.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No ride posts found.</p>
                  ) : (
                    overview.rides.map((ride) => (
                      <div key={ride._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">Driver: {ride.driver?.name || 'Unknown'}</p>
                        <p className="text-sm text-[#94A3B8]">From: {ride.origin?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">To: {ride.destination?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Departure: {formatDate(ride.departureTime)}</p>
                        <p className="text-sm text-[#94A3B8]">Seats: {ride.seatsBooked}/{ride.seatsTotal} | Status: {ride.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Matchmaking Requests</h2>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {overview.matchmakingRequests.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No matchmaking requests found.</p>
                  ) : (
                    overview.matchmakingRequests.map((request) => (
                      <div key={request._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">Rider: {request.rider?.name || 'Unknown'} | Driver: {request.driver?.name || 'Unknown'}</p>
                        <p className="text-sm text-[#94A3B8]">Pickup: {request.ride?.origin?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Dropoff: {request.ride?.destination?.address || 'N/A'}</p>
                        <p className="text-sm text-[#94A3B8]">Request Time: {formatDate(request.createdAt)}</p>
                        <p className="text-sm text-[#94A3B8]">Seats: {request.seatsBooked} | Status: {request.status} | Price: {request.tripPrice}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Sharer Information</h2>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {overview.sharers.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No sharers found.</p>
                  ) : (
                    overview.sharers.map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">{person.name}</p>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId}</p>
                        <p className="text-sm text-[#94A3B8]">Verified: {person.isVerified ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-[#94A3B8]">Vehicle: {person.vehicle?.make} {person.vehicle?.model} ({person.vehicle?.licensePlate})</p>
                        <p className="text-sm text-[#94A3B8]">Total Rides: {person.totalRides || 0}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/60 p-5">
                <h2 className="text-xl font-semibold text-white mb-4">Hopper Information</h2>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {overview.hoppers.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No hoppers found.</p>
                  ) : (
                    overview.hoppers.map((person) => (
                      <div key={person._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/70 p-4">
                        <p className="text-white font-semibold">{person.name}</p>
                        <p className="text-sm text-[#94A3B8]">{person.email}</p>
                        <p className="text-sm text-[#94A3B8]">Student ID: {person.studentId}</p>
                        <p className="text-sm text-[#94A3B8]">Verified: {person.isVerified ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-[#94A3B8]">Total Rides: {person.totalRides || 0}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
