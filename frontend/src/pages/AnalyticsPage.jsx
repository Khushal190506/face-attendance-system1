import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, PieChart as PieIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { attendanceService } from '../services/attendance.service';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState({ weeklyData: [], departmentData: [], monthlyData: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await attendanceService.getAnalytics();
        setData({
          weeklyData: (res.weeklyData || []).map((d) => ({ ...d, date: d.date.slice(5) })),
          departmentData: res.departmentData || [],
          monthlyData: (res.monthlyData || []).map((d) => ({ ...d, date: d.date.slice(5) })),
        });
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deptPieData = data.departmentData.map((d) => ({
    name: d.department,
    value: d.present,
    total: d.total,
  }));

  const deptBarData = data.departmentData.map((d) => ({
    name: d.department.replace(' Science', ' Sci.').replace('Electronics', 'Elec.').replace('Mechanical', 'Mech.'),
    present: d.present,
    absent: d.total - d.present,
    total: d.total,
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={24} className="text-primary-400" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Attendance trends and statistics</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Top row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Bar Chart */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-400" />
                Last 7 Days Attendance
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Present" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Pie */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <PieIcon size={16} className="text-purple-400" />
                Department-wise Present Today
              </h3>
              {deptPieData.length === 0 || deptPieData.every((d) => d.value === 0) ? (
                <div className="flex items-center justify-center h-48 text-gray-600">
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={deptPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {deptPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} present`, n]} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly Area Chart */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              30-Day Attendance Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorMonthly)" name="Present" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Department Bar */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Department-wise Breakdown
            </h3>
            {deptBarData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-600">
                <p className="text-sm">No department data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#9ca3af' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" stackId="a" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
