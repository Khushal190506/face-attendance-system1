const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// @desc    Get attendance records
// @route   GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { date, subject, department, studentId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const query = {};

    if (date) query.date = date;
    if (subject) query.subject = subject;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };

    // If filtering by department, get student IDs first
    if (department || studentId) {
      const studentQuery = {};
      if (department) studentQuery.department = department;
      if (studentId) studentQuery._id = studentId;
      const students = await Student.find(studentQuery).select('_id');
      query.student = { $in: students.map((s) => s._id) };
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('student', 'fullName rollNumber department year photo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, records, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance manually
// @route   POST /api/attendance
const markAttendance = async (req, res) => {
  try {
    const { studentId, subject, status, date, time } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    const now = time || new Date().toTimeString().split(' ')[0];

    // Check for existing attendance
    const existing = await Attendance.findOne({ student: studentId, date: today, subject: subject || 'General' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      student: studentId,
      date: today,
      time: now,
      subject: subject || 'General',
      status: status || 'present',
      markedBy: 'manual',
      markedByUser: req.user._id,
    });

    await attendance.populate('student', 'fullName rollNumber department');
    await ActivityLog.create({
      action: 'ATTENDANCE_MARKED',
      description: `Manual attendance for ${attendance.student.fullName}`,
      type: 'attendance',
      user: req.user._id,
      student: studentId,
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's attendance summary
// @route   GET /api/attendance/today
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ date: today })
      .populate('student', 'fullName rollNumber department year photo')
      .sort({ createdAt: -1 });

    const totalStudents = await Student.countDocuments({ isActive: true });
    const presentCount = records.length;
    const absentCount = totalStudents - presentCount;

    res.json({
      success: true,
      records,
      stats: {
        total: totalStudents,
        present: presentCount,
        absent: absentCount,
        percentage: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance analytics (monthly)
// @route   GET /api/attendance/analytics
const getAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    // Weekly attendance data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const weeklyData = await Promise.all(
      last7Days.map(async (date) => {
        const count = await Attendance.countDocuments({ date, status: 'present' });
        return { date, count };
      })
    );

    // Department-wise attendance
    const departments = await Student.distinct('department', { isActive: true });
    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const students = await Student.find({ department: dept, isActive: true }).select('_id');
        const studentIds = students.map((s) => s._id);
        const today = new Date().toISOString().split('T')[0];
        const present = await Attendance.countDocuments({ student: { $in: studentIds }, date: today });
        return { department: dept, total: students.length, present };
      })
    );

    // Monthly summary (last 30 days attendance count per day)
    const monthlyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await Attendance.countDocuments({ date: dateStr, status: 'present' });
      monthlyData.push({ date: dateStr, count });
    }

    res.json({ success: true, weeklyData, departmentData, monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student attendance summary
// @route   GET /api/attendance/student/:id
const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.id }).sort({ date: -1 });
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, records, stats: { total, present, absent: total - present, percentage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export attendance to Excel
// @route   GET /api/attendance/export/excel
const exportExcel = async (req, res) => {
  try {
    const { date, subject, department } = req.query;
    const query = {};
    if (date) query.date = date;
    if (subject) query.subject = subject;

    const records = await Attendance.find(query)
      .populate('student', 'fullName rollNumber department year email')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance Report');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Roll No', key: 'roll', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Time', key: 'time', width: 12 },
      { header: 'Subject', key: 'subject', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Confidence %', key: 'confidence', width: 15 },
      { header: 'Marked By', key: 'markedBy', width: 18 },
    ];

    // Style header row
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    records.forEach((r) => {
      sheet.addRow({
        date: r.date,
        roll: r.student?.rollNumber || '',
        name: r.student?.fullName || '',
        dept: r.student?.department || '',
        year: r.student?.year || '',
        time: r.time,
        subject: r.subject,
        status: r.status.toUpperCase(),
        confidence: r.confidence ? `${r.confidence}%` : 'Manual',
        markedBy: r.markedBy,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${date || 'all'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export attendance to PDF
// @route   GET /api/attendance/export/pdf
const exportPDF = async (req, res) => {
  try {
    const { date, subject } = req.query;
    const query = {};
    if (date) query.date = date;
    if (subject) query.subject = subject;

    const records = await Attendance.find(query)
      .populate('student', 'fullName rollNumber department year')
      .sort({ date: -1 })
      .limit(200);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${date || 'report'}.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).fillColor('#4F46E5').text('AI Face Attendance System - Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333').text(`Date: ${date || 'All'} | Subject: ${subject || 'All'} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Table headers
    const cols = ['Roll No', 'Name', 'Department', 'Date', 'Time', 'Status', 'Confidence'];
    const colWidths = [80, 150, 120, 90, 80, 70, 80];
    let x = 40;
    let y = doc.y;

    doc.fillColor('#4F46E5');
    cols.forEach((col, i) => {
      doc.rect(x, y, colWidths[i], 20).fill();
      doc.fillColor('#fff').fontSize(9).text(col, x + 4, y + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });

    y += 20;

    records.forEach((r, idx) => {
      x = 40;
      const rowData = [
        r.student?.rollNumber || '',
        r.student?.fullName || '',
        r.student?.department || '',
        r.date,
        r.time,
        r.status?.toUpperCase() || '',
        r.confidence ? `${r.confidence}%` : 'Manual',
      ];

      doc.fillColor(idx % 2 === 0 ? '#f8f9fa' : '#ffffff');
      rowData.forEach((val, i) => {
        doc.rect(x, y, colWidths[i], 18).fill();
        doc.fillColor('#333').fontSize(8).text(val, x + 4, y + 4, { width: colWidths[i] - 8 });
        x += colWidths[i];
      });
      y += 18;

      if (y > 540) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
const deleteAttendance = async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  getTodayAttendance,
  getAnalytics,
  getStudentAttendance,
  exportExcel,
  exportPDF,
  deleteAttendance,
};
