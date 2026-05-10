const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: null, // main profile photo path
    },
    faceImages: {
      type: [String],
      default: [], // array of Cloudinary URLs of face samples
    },
    faceDatasetCount: {
      type: Number,
      default: 0, // number of face samples captured
    },
    isFaceRegistered: {
      type: Boolean,
      default: false,
    },
    studentId: {
      type: Number, // numeric ID used by face recognizer model
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-generate numeric studentId before saving
studentSchema.pre('save', async function () {
  if (this.isNew && !this.studentId) {
    const lastStudent = await mongoose.model('Student').findOne().sort({ studentId: -1 });
    this.studentId = lastStudent ? lastStudent.studentId + 1 : 1;
  }
});

module.exports = mongoose.model('Student', studentSchema);
