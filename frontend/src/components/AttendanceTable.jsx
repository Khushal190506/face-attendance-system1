import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AttendanceTable({ records, onDelete, loading }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        r.student?.fullName?.toLowerCase().includes(q) ||
        r.student?.rollNumber?.toLowerCase().includes(q) ||
        r.student?.department?.toLowerCase().includes(q) ||
        r.subject?.toLowerCase().includes(q);
      const matchStatus = statusFilter ? r.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl mb-3" />)}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, roll, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 appearance-none"
        >
          <option value="" className="bg-gray-900">All Status</option>
          <option value="present" className="bg-gray-900">Present</option>
          <option value="absent" className="bg-gray-900">Absent</option>
          <option value="late" className="bg-gray-900">Late</option>
        </select>
        <span className="text-xs text-gray-500 flex items-center">
          {filtered.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Student</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll No</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Confidence</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Method</th>
              {onDelete && <th className="px-4 py-3 text-gray-400 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              filtered.map((record, i) => (
                <motion.tr
                  key={record._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/4 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {record.student?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium text-sm">{record.student?.fullName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{record.student?.rollNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{record.student?.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{record.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock size={11} />
                      {record.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-lg bg-primary-500/10 text-primary-300 text-xs border border-primary-500/20">
                      {record.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {record.status === 'present' ? (
                      <span className="badge-present"><CheckCircle size={10} /> Present</span>
                    ) : record.status === 'late' ? (
                      <span className="badge-late"><Clock size={10} /> Late</span>
                    ) : (
                      <span className="badge-absent"><XCircle size={10} /> Absent</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.confidence ? (
                      <span className={`text-xs font-semibold ${record.confidence >= 80 ? 'text-emerald-400' : record.confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {record.confidence}%
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${
                      record.markedBy === 'face_recognition'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {record.markedBy === 'face_recognition' ? '🤖 AI' : '👤 Manual'}
                    </span>
                  </td>
                  {onDelete && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDelete(record._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
