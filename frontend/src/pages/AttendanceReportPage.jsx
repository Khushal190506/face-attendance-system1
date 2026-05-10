import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Download, FileText, RefreshCw, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../services/attendance.service';
import AttendanceTable from '../components/AttendanceTable';

export default function AttendanceReportPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    department: '',
  });
  const [stats, setStats] = useState({});
  const [exporting, setExporting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.subject) params.subject = filters.subject;
      if (filters.department) params.department = filters.department;

      const { data } = await attendanceService.getAll(params);
      setRecords(data.records || []);

      const present = (data.records || []).filter((r) => r.status === 'present').length;
      setStats({ total: data.records?.length || 0, present, absent: (data.records?.length || 0) - present });
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceService.delete(id);
      toast.success('Record deleted');
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const { data } = await attendanceService.exportExcel(filters.date ? { date: filters.date } : {});
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${filters.date || 'all'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const { data } = await attendanceService.exportPDF(filters.date ? { date: filters.date } : {});
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${filters.date || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported!');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting('');
    }
  };

  const SUBJECTS = ['', 'General', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'English', 'Lab'];
  const DEPARTMENTS = ['', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList size={24} className="text-primary-400" />
            Attendance Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">{records.length} records found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} disabled={exporting === 'excel'} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} />
            {exporting === 'excel' ? 'Exporting...' : 'Excel'}
          </button>
          <button onClick={handleExportPDF} disabled={exporting === 'pdf'} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText size={15} />
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>
          <button onClick={load} className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: stats.total || 0, color: 'text-white' },
          { label: 'Present', value: stats.present || 0, color: 'text-emerald-400' },
          { label: 'Absent', value: stats.absent || 0, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <Filter size={15} className="text-primary-400" />
          Filter Records
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="input-label flex items-center gap-1"><Calendar size={12} /> Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="input-label">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="input-field text-sm appearance-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-gray-900">{s || 'All Subjects'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="input-field text-sm appearance-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-gray-900">{d || 'All Departments'}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={load} className="btn-primary mt-3 text-sm flex items-center gap-2">
          <Filter size={14} />
          Apply Filters
        </button>
      </div>

      {/* Table */}
      <AttendanceTable records={records} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
