const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for student profile photos
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'face_attendance/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `profile_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// Storage for face dataset images (sent from Python service or frontend)
const faceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      const studentId = req.params.studentNumId || req.params.studentId || req.body.studentId || req.body.studentNumId || 'unknown';
      return `face_attendance/dataset/student_${studentId}`;
    },
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `face_${Date.now()}`,
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadFace = multer({
  storage: faceStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { uploadProfile, uploadFace };
