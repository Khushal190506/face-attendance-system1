import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Activity, TrendingUp, Clock, CheckCircle, Brain } from 'lucide-react';
import StatCard from '../components/StatCard';
import { recognitionService } from '../services/recognition.service';
import { attendanceService } from '../services/attendance.service';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0]?.value} present</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, todayPresent: 0, totalLogs: 0 });
  const [recentRecognized, setRecentRecognized] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [todayStats, setTodayStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, analyticsRes, todayRes, logsRes] = await Promise.all([
          recognitionService.getDashboard(),
          attendanceService.getAnalytics(),
          attendanceService.getToday(),
          recognitionService.getLogs(),
        ]);
        setStats(dashRes.data.stats);
        setRecentRecognized(dashRes.data.recentRecognized);
        setWeeklyData(analyticsRes.data.weeklyData?.map(d => ({ ...d, date: d.date.slice(5) })) || []);
        setDeptData(analyticsRes.data.departmentData || []);
        setTodayStats(todayRes.data.stats || {});
        setLogs((logsRes.data.logs || []).slice(0, 8));
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pieData = [
    { name: 'Present', value: todayStats.present || 0 },
    { name: 'Absent', value: todayStats.absent || 0 },
  ];

  const typeIcon = (type) => {
    const map = {
      attendance: <CheckCircle size={12} className="text-emerald-400" />,
      student: <Users size={12} className="text-blue-400" />,
      auth: <UserCheck size={12} className="text-purple-400" />,
      recognition: <Brain size={12} className="text-primary-400" />,
      system: <Activity size={12} className="text-gray-400" />,
    };
    return map[type] || map.system;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's today's attendance overview —{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={loading ? '...' : stats.totalStudents}
          subtitle="Registered in system"
          icon={Users}
          color="blue"
          index={0}
        />
        <StatCard
          title="Present Today"
          value={loading ? '...' : stats.todayPresent}
          subtitle={`${todayStats.percentage || 0}% attendance rate`}
          icon={UserCheck}
          color="green"
          index={1}
        />
        <StatCard
          title="Absent Today"
          value={loading ? '...' : todayStats.absent ?? '—'}
          subtitle="Need follow-up"
          icon={TrendingUp}
          color="orange"
          index={2}
        />
        <StatCard
          title="Activity Logs"
          value={loading ? '...' : stats.totalLogs}
          subtitle="System events"
          icon={Activity}
          color="purple"
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Trend */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-400" />
            Weekly Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" dot={{ fill: '#6366f1', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Pie */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            Today's Status
          </h3>
          {todayStats.total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-gray-400">Present {todayStats.present}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-400">Absent {todayStats.absent}</span></div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <CheckCircle size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No attendance yet today</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recently Recognized */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Brain size={16} className="text-primary-400" />
            Recently Recognized
          </h3>
          {recentRecognized.length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-8">No face recognitions today</div>
          ) : (
            <div className="space-y-3">
              {recentRecognized.slice(0, 5).map((record, i) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {record.student?.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{record.student?.fullName}</p>
                    <p className="text-gray-500 text-xs">{record.student?.rollNumber} · {record.student?.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${record.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {record.confidence}%
                    </p>
                    <p className="text-gray-600 text-xs">{record.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-purple-400" />
            Activity Log
          </h3>
          {logs.length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-8">No activity yet</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/4 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">{typeIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-xs leading-relaxed truncate">{log.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} className="text-gray-600" />
                      <span className="text-gray-600 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
