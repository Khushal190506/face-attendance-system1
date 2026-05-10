import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, RefreshCw, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentTable from '../components/StudentTable';
import StudentForm from './StudentFormPage';
import { studentService } from '../services/student.service';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const navigate = useNavigate();

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll();
      setStudents(data.students || []);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentService.delete(id);
      toast.success('Student deleted');
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setShowForm(true);
  };

  const handleRegisterFace = (student) => {
    navigate(`/face-register?studentId=${student._id}&studentNumId=${student.studentId}&name=${encodeURIComponent(student.fullName)}`);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditStudent(null);
    loadStudents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={24} className="text-primary-400" />
            Student Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {students.length} registered students
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStudents} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => { setEditStudent(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <UserPlus size={15} />
            Add Student
          </button>
        </div>
      </motion.div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditStudent(null); } }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl"
          >
            <StudentForm
              student={editStudent}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowForm(false); setEditStudent(null); }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Table */}
      <StudentTable
        students={students}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRegisterFace={handleRegisterFace}
        loading={loading}
      />
    </div>
  );
}
