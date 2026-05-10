import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Upload, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentService } from '../services/student.service';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology', 'Chemical', 'Biotechnology'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function StudentFormPage({ student, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    fullName: '', rollNumber: '', department: '', year: '', email: '', phone: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName || '',
        rollNumber: student.rollNumber || '',
        department: student.department || '',
        year: student.year || '',
        email: student.email || '',
        phone: student.phone || '',
      });
    }
  }, [student]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (photo) formData.append('photo', photo);

      if (student) {
        await studentService.update(student._id, formData);
        toast.success('Student updated successfully!');
      } else {
        await studentService.create(formData);
        toast.success('Student added successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={20} className="text-primary-400" />
          {student ? 'Edit Student' : 'Add New Student'}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/10">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-gray-600" />
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-1">Student Photo</p>
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-2 inline-flex">
              <Upload size={13} />
              {preview ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <p className="text-gray-600 text-xs mt-1">JPG, PNG up to 5MB</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="John Smith"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Roll Number *</label>
            <input
              type="text"
              required
              placeholder="CS2024001"
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Department *</label>
            <select
              required
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="input-field appearance-none"
            >
              <option value="" className="bg-gray-900">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-gray-900">{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Year *</label>
            <select
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="input-field appearance-none"
            >
              <option value="" className="bg-gray-900">Select year</option>
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-gray-900">{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Email Address *</label>
            <input
              type="email"
              required
              placeholder="student@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <X size={16} />
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
