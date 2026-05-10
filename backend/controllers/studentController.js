const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all students
// @route   GET /api/students
const getStudents = async (req, res) => {
  try {
    const { search, department, year, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (year) query.year = year;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create student
// @route   POST /api/students
const createStudent = async (req, res) => {
  try {
    const { fullName, rollNumber, department, year, email, phone } = req.body;

    const photoPath = req.file ? req.file.path : null;

    const student = await Student.create({
      fullName,
      rollNumber,
      department,
      year,
      email,
      phone,
      photo: photoPath,
    });

    await ActivityLog.create({
      action: 'STUDENT_CREATED',
      description: `Student registered: ${fullName} (${rollNumber})`,
      type: 'student',
      user: req.user._id,
      student: student._id,
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Roll number or email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.photo = req.file.path;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await ActivityLog.create({
      action: 'STUDENT_UPDATED',
      description: `Student updated: ${student.fullName}`,
      type: 'student',
      user: req.user._id,
      student: student._id,
    });

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await ActivityLog.create({
      action: 'STUDENT_DELETED',
      description: `Student removed: ${student.fullName} (${student.rollNumber})`,
      type: 'student',
      user: req.user._id,
    });

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get department list (distinct)
// @route   GET /api/students/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Student.distinct('department', { isActive: true });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getDepartments };
