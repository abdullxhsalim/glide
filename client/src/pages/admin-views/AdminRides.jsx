import React, { useState } from 'react';
import { Car, MapPin, Calendar, Clock, Navigation } from 'lucide-react';

const AdminRides = ({ overview }) => {
  const { rides, matchmakingRequests } = overview;
  const [activeTab, setActiveTab] = useState('rides');

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'accepted':
      case 'completed': return 'text-[#10B981] bg-[#10B981]/10';
      case 'cancelled':
      case 'rejected': return 'text-[#EF4444] bg-[#EF4444]/10';
      case 'pending': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      default: return 'text-[#94A3B8] bg-[#334155]/50';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 border-b border-[#334155] pb-2">
        <TabButton active={activeTab === 'rides'} onClick={() => setActiveTab('rides')} icon={Car} label={`Active Rides (${rides?.length || 0})`} color="text-[#8B5CF6]" />
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={Navigation} label={`Matchmaking Requests (${matchmakingRequests?.length || 0})`} color="text-[#22C55E]" />
      </div>

      <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl overflow-hidden">
        {activeTab === 'rides' ? (
           <RidesTable rides={rides} formatDate={formatDate} getStatusColor={getStatusColor} />
        ) : (
           <RequestsTable requests={matchmakingRequests} formatDate={formatDate} getStatusColor={getStatusColor} />
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

const RidesTable = ({ rides, formatDate, getStatusColor }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-[#94A3B8]">
      <thead className="bg-[#0F172A] text-xs uppercase text-[#94A3B8] border-b border-[#334155]">
        <tr>
          <th className="px-6 py-4">Driver</th>
          <th className="px-6 py-4">Route</th>
          <th className="px-6 py-4">Schedule</th>
          <th className="px-6 py-4">Price / Seats</th>
          <th className="px-6 py-4">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#334155]">
        {rides?.map(ride => (
          <tr key={ride._id} className="hover:bg-[#0F172A]/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-medium text-white">{ride.driver?.name || 'Unknown'}</div>
              <div className="text-xs text-[#64748B]">{ride.driver?.vehicleModel || ''}</div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1 text-white text-xs"><MapPin className="w-3 h-3 text-[#10B981]"/> {ride.origin.address}</div>
              <div className="flex items-center gap-1 mt-1 text-white text-xs"><MapPin className="w-3 h-3 text-[#EF4444]"/> {ride.destination.address}</div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(ride.departureTime).toLocaleDateString()}</div>
              <div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {new Date(ride.departureTime).toLocaleTimeString()}</div>
            </td>
            <td className="px-6 py-4">
              <div className="font-medium text-[#F59E0B]">৳{ride.price}</div>
              <div className="text-xs">{ride.availableSeats} seats left</div>
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(ride.status)}`}>
                {ride.status}
              </span>
            </td>
          </tr>
        ))}
        {(!rides || rides.length === 0) && (
          <tr><td colSpan="5" className="px-6 py-8 text-center text-[#64748B]">No rides available.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const RequestsTable = ({ requests, formatDate, getStatusColor }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-[#94A3B8]">
      <thead className="bg-[#0F172A] text-xs uppercase text-[#94A3B8] border-b border-[#334155]">
        <tr>
          <th className="px-6 py-4">Passenger</th>
          <th className="px-6 py-4">Route Requested</th>
          <th className="px-6 py-4">Time Window</th>
          <th className="px-6 py-4">Matches Found</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#334155]">
        {requests?.map(req => (
          <tr key={req._id} className="hover:bg-[#0F172A]/50 transition-colors">
            <td className="px-6 py-4 font-medium text-white">{req.passenger?.name || 'Unknown'}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1 text-white text-xs"><MapPin className="w-3 h-3 text-[#10B981]"/> {req.origin?.address}</div>
              <div className="flex items-center gap-1 mt-1 text-white text-xs"><MapPin className="w-3 h-3 text-[#EF4444]"/> {req.destination?.address}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-xs">{formatDate(req.earliestDeparture)}</div>
              <div className="text-xs mt-1 text-[#64748B]">to {formatDate(req.latestDeparture)}</div>
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs bg-[#334155]/50 text-white`}>
                {req.matches?.length || 0} Matches
              </span>
            </td>
          </tr>
        ))}
        {(!requests || requests.length === 0) && (
          <tr><td colSpan="4" className="px-6 py-8 text-center text-[#64748B]">No matchmaking requests.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

export default AdminRides;
