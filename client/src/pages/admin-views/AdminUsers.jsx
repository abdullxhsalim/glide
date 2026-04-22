import React, { useState } from 'react';
import { Users, Clock3, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

const AdminUsers = ({ overview, onEditUser, onDeleteUser, onReviewVehicle, managingUserId, reviewingId }) => {
  const { hoppers, sharers, pendingVehicleVerifications } = overview;
  const [activeTab, setActiveTab] = useState('all');

  const allUsers = [...(sharers || []), ...(hoppers || [])];

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleString();
  };

  const getFilteredUsers = () => {
    switch (activeTab) {
      case 'sharers': return sharers;
      case 'hoppers': return hoppers;
      default: return allUsers;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 border-b border-[#334155] pb-2">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={Users} label={`All Users (${allUsers.length})`} />
        <TabButton active={activeTab === 'sharers'} onClick={() => setActiveTab('sharers')} icon={Users} label={`Sharers (${sharers?.length || 0})`} color="text-[#3B82F6]" />
        <TabButton active={activeTab === 'hoppers'} onClick={() => setActiveTab('hoppers')} icon={Users} label={`Hoppers (${hoppers?.length || 0})`} color="text-[#F59E0B]" />
        <TabButton active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')} icon={Clock3} label={`Pending Verifications (${pendingVehicleVerifications?.length || 0})`} color="text-[#EF4444]" />
      </div>

      <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl overflow-hidden">
        {activeTab === 'verifications' ? (
           <VerificationsTable 
             verifications={pendingVehicleVerifications} 
             onReview={onReviewVehicle} 
             reviewingId={reviewingId} 
             formatDate={formatDate}
           />
        ) : (
           <UsersTable 
             users={getFilteredUsers()} 
             onEdit={onEditUser} 
             onDelete={onDeleteUser} 
             managingUserId={managingUserId} 
             formatDate={formatDate}
           />
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label, color = "text-[#94A3B8]" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
      active ? 'border-[#10B981] text-white' : 'border-transparent text-[#94A3B8] hover:text-white hover:border-[#475569]'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-[#10B981]' : color}`} />
    {label}
  </button>
);

const UsersTable = ({ users, onEdit, onDelete, managingUserId, formatDate }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-[#94A3B8]">
      <thead className="bg-[#0F172A] text-xs uppercase text-[#94A3B8] border-b border-[#334155]">
        <tr>
          <th className="px-6 py-4">Name/Email</th>
          <th className="px-6 py-4">Role</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Joined</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#334155]">
        {users?.map(user => (
          <tr key={user._id} className="hover:bg-[#0F172A]/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-medium text-white">{user.name}</div>
              <div className="text-xs">{user.email}</div>
            </td>
            <td className="px-6 py-4 capitalize">{user.role}</td>
            <td className="px-6 py-4">
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#94A3B8] bg-[#334155]/50 px-2 py-1 rounded-full text-xs">
                  <XCircle className="w-3 h-3" /> Unverified
                </span>
              )}
            </td>
            <td className="px-6 py-4">{formatDate(user.createdAt)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onEdit(user)}
                  disabled={managingUserId === user._id}
                  className="px-3 py-1 text-xs font-medium text-[#FCD34D] bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-md hover:bg-[#F59E0B]/20"
                >Edit</button>
                <button
                  onClick={() => onDelete(user)}
                  disabled={managingUserId === user._id}
                  className="px-3 py-1 text-xs font-medium text-[#FCA5A5] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-md hover:bg-[#EF4444]/20"
                >Soft Delete</button>
              </div>
            </td>
          </tr>
        ))}
        {(!users || users.length === 0) && (
          <tr><td colSpan="5" className="px-6 py-8 text-center text-[#64748B]">No users found in this category.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const VerificationsTable = ({ verifications, onReview, reviewingId, formatDate }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-[#94A3B8]">
      <thead className="bg-[#0F172A] text-xs uppercase text-[#94A3B8] border-b border-[#334155]">
        <tr>
          <th className="px-6 py-4">User</th>
          <th className="px-6 py-4">Vehicle Details</th>
          <th className="px-6 py-4">Requested At</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#334155]">
        {verifications?.map(req => (
          <tr key={req._id} className="hover:bg-[#0F172A]/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-medium text-white">{req.name}</div>
              <div className="text-xs">{req.email}</div>
            </td>
            <td className="px-6 py-4">
              {req.vehicleMake} {req.vehicleModel} ({req.vehicleYear})<br/>
              <span className="text-xs text-[#64748B]">Plate: {req.vehiclePlate}</span>
            </td>
            <td className="px-6 py-4">{formatDate(req.vehicleVerificationRequestedAt)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onReview(req._id, 'approve')}
                  disabled={reviewingId === req._id}
                  className="px-3 py-1 text-xs font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 rounded-md hover:bg-[#10B981]/20 inline-flex items-center gap-1"
                ><CheckCircle2 className="w-3 h-3" /> Approve</button>
                <button
                  onClick={() => onReview(req._id, 'reject')}
                  disabled={reviewingId === req._id}
                  className="px-3 py-1 text-xs font-medium text-[#FCA5A5] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-md hover:bg-[#EF4444]/20 inline-flex items-center gap-1"
                ><XCircle className="w-3 h-3" /> Reject</button>
              </div>
            </td>
          </tr>
        ))}
        {(!verifications || verifications.length === 0) && (
          <tr><td colSpan="4" className="px-6 py-8 text-center text-[#64748B]">No pending vehicle verifications.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

export default AdminUsers;
