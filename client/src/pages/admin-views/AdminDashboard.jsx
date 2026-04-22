import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Users, Car, CalendarCheck2, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdminDashboard = ({ overview }) => {
  const { summary, analytics } = overview;

  // Format data for Recharts
  const userGrowthData = analytics?.usersSeries || [];
  const rideGrowthData = analytics?.ridesSeries || [];
  
  // Combine series for a single chart if dates match, or just show them separately
  // Since they might not have the same dates perfectly, we can render multiple charts or merge them
  const mergedGrowthData = userGrowthData.map((u, i) => {
      const r = rideGrowthData.find(ride => ride.date === u.date) || { count: 0 };
      const b = analytics?.bookingsSeries?.find(book => book.date === u.date) || { count: 0 };
      return {
          date: u.date,
          Users: u.count,
          Rides: r.count,
          Bookings: b.count
      };
  });

  const ridesPieData = Object.entries(analytics?.ridesByStatus || {}).map(([name, value]) => ({ name, value }));
  const bookingsPieData = Object.entries(analytics?.bookingsByStatus || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Total Users" value={summary.totalUsers} icon={Users} color="text-green-400" />
         <StatCard title="Total Rides" value={summary.totalRidePosts} icon={Car} color="text-blue-400" />
         <StatCard title="Total Bookings" value={summary.totalBookings} icon={CalendarCheck2} color="text-yellow-400" />
         <StatCard title="Gross Revenue" value={`৳${summary.grossRevenue.toFixed(2)}`} icon={Wallet} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#10B981]" /> Platform Growth (Last 30 Days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="Users" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Rides" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Bookings" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#3B82F6]" /> Booking Status Breakdown
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingsPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {bookingsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Rides Status Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ridesPieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }} />
                    <Bar dataKey="value" fill="#8B5CF6">
                      {ridesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Key Performance Indicators</h3>
            <div className="space-y-4">
                <div className="bg-[#0F172A] p-4 rounded-lg flex justify-between items-center border border-[#334155]">
                    <span className="text-[#94A3B8]">Booking Acceptance Rate</span>
                    <span className="text-xl font-bold text-[#10B981]">{summary.bookingAcceptanceRate.toFixed(1)}%</span>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg flex justify-between items-center border border-[#334155]">
                    <span className="text-[#94A3B8]">Driver Verification Approval Rate</span>
                    <span className="text-xl font-bold text-[#3B82F6]">{summary.driverVerificationApprovalRate.toFixed(1)}%</span>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg flex justify-between items-center border border-[#334155]">
                    <span className="text-[#94A3B8]">Average Trip Value</span>
                    <span className="text-xl font-bold text-[#F59E0B]">৳{summary.averageTripValue.toFixed(2)}</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-5 flex items-center gap-4 hover:border-[#475569] transition-colors">
    <div className={`p-3 rounded-lg bg-[#0F172A] border border-[#334155] ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-[#94A3B8]">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
