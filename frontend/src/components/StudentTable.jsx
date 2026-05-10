import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, Edit, Trash2, Camera, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function StudentTable({ students, onEdit, onDelete, onRegisterFace, onView, loading }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState('asc');
  const [deptFilter, setDeptFilter] = useState('');

  const departments = useMemo(() => [...new Set(students.map((s) => s.department))], [students]);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
          s.fullName?.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q);
        const matchDept = deptFilter ? s.department === deptFilter : true;
        return matchSearch && matchDept;
      })
      .sort((a, b) => {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [students, search, sortKey, sortDir, deptFilter]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-50">
      {sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />) : <ChevronUp size={12} className="inline opacity-30" />}
    </span>
  );

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 appearance-none"
          >
            <option value="" className="bg-gray-900">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d} className="bg-gray-900">{d}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('fullName')}>
                Student <SortIcon col="fullName" />
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('rollNumber')}>
                Roll No <SortIcon col="rollNumber" />
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('department')}>
                Department <SortIcon col="department" />
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Year</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Face Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              filtered.map((student, i) => (
                <motion.tr
                  key={student._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/4 transition-colors"
                >
                  {/* Student avatar + name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                        {student.photo ? (
                          <img
                            src={`${API_URL}${student.photo}`}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
                          style={{ display: student.photo ? 'none' : 'flex' }}
                        >
                          {student.fullName?.[0]?.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{student.fullName}</p>
                        <p className="text-gray-500 text-xs">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{student.rollNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-300 text-xs border border-primary-500/20">
                      {student.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{student.year}</td>
                  <td className="px-4 py-3">
                    {student.isFaceRegistered ? (
                      <span className="badge-present">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Registered ({student.faceDatasetCount})
                      </span>
                    ) : (
                      <span className="badge-absent">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {student.faceDatasetCount > 0 ? `${student.faceDatasetCount}/5` : 'Not Set'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRegisterFace(student)}
                        className="p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 transition-colors"
                        title="Register Face"
                      >
                        <Camera size={15} />
                      </button>
                      <button
                        onClick={() => onView?.(student)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => onEdit(student)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(student._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
