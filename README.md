# 🎓 FaceAttend AI — AI Face Attendance System

A production-ready full-stack AI attendance management system using MERN stack + Python face recognition.

---

## 🏗️ Architecture

```
Frontend (React + Vite)  ←→  Backend (Node.js + Express)  ←→  MongoDB
                                        ↕
                          Python AI Service (Flask + OpenCV)
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, Framer Motion, Recharts, React Webcam |
| Backend | Node.js, Express.js, Mongoose, JWT, Multer, ExcelJS, PDFKit |
| Database | MongoDB (local or Atlas) |
| AI Service | Python 3.8+, Flask, OpenCV LBPH, NumPy, Pillow |

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- Python 3.8+ with pip
- MongoDB (local) OR MongoDB Atlas account

### 1. Clone & Navigate
```bash
cd face-attendance-system
```

### 2. Backend Setup
```bash
cd backend
# Copy environment variables
copy .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Python AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python app.py
# AI Service runs on http://localhost:8000
```

> **Windows Note:** If you get OpenCV issues, try:
> ```bash
> pip install opencv-contrib-python
> ```

### 4. Frontend Setup
```bash
cd frontend
copy .env .env.local
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/face_attendance
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

---

## 📋 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register admin |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current user |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | Get records |
| POST | `/api/attendance` | Mark manually |
| GET | `/api/attendance/today` | Today's report |
| GET | `/api/attendance/analytics` | Charts data |
| GET | `/api/attendance/export/excel` | Export to Excel |
| GET | `/api/attendance/export/pdf` | Export to PDF |

### AI Recognition
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recognition/health` | AI service status |
| POST | `/api/recognition/capture/:id` | Capture face sample |
| POST | `/api/recognition/train` | Train model |
| POST | `/api/recognition/recognize` | Recognize face |

### Python AI Service (port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/train` | Train LBPH model |
| POST | `/recognize` | Recognize face |
| POST | `/capture/<id>` | Save face sample |
| POST | `/detect` | Detect face bounding boxes |

---

## 🎯 System Workflow

```
1. Admin logs in with JWT auth
2. Admin adds student (name, roll, dept, year, email, photo)
3. Admin goes to Face Register → opens webcam
4. Captures 10+ face samples (auto or manual)
5. Clicks "Train AI Model" → Python trains LBPH model
6. Goes to Take Attendance → selects subject
7. Starts session → webcam opens
8. Students walk in front of camera
9. System detects face → compares to model → marks attendance
10. Attendance saved to MongoDB with confidence score
11. View reports and analytics in dashboard
```

---

## 📁 Folder Structure

```
face-attendance-system/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── attendanceController.js
│   │   └── recognitionController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Attendance.js
│   │   └── ActivityLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── attendance.js
│   │   ├── recognition.js
│   │   └── logs.js
│   ├── uploads/           (auto-created)
│   ├── .env
│   └── server.js
│
├── ai-service/
│   ├── app.py             (Flask API)
│   ├── face_trainer.py    (LBPH training)
│   ├── face_recognizer.py (recognition)
│   ├── dataset/           (student face images)
│   ├── models/            (trained model)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── context/       (AuthContext)
│   │   ├── services/      (API calls)
│   │   ├── components/    (UI components)
│   │   └── pages/         (page components)
│   ├── .env
│   └── index.html
│
└── README.md
```

---

## 🎨 Features

- ✅ JWT Authentication (admin login/signup)
- ✅ Student CRUD with photo upload
- ✅ Face dataset capture (webcam, auto/manual)
- ✅ OpenCV LBPH face recognition model
- ✅ Real-time face attendance with confidence score
- ✅ Unknown face detection alerts
- ✅ Prevent duplicate attendance per session
- ✅ Export to Excel and PDF
- ✅ Weekly/monthly analytics charts
- ✅ Department-wise breakdown
- ✅ Activity logs
- ✅ Glassmorphism dark UI
- ✅ Animated sidebar, cards, charts
- ✅ Mobile responsive

---

## 🔒 Security Notes

- Change `JWT_SECRET` in `.env` before production
- Use MongoDB Atlas with authentication for production
- Implement HTTPS in production
- Face images stored locally in `ai-service/dataset/`

---

## 📞 Troubleshooting

**Camera not working?**
- Allow camera permissions in your browser
- Use `https://` or `localhost` (not IP) for camera API

**AI Service offline?**
- Start `python app.py` in `ai-service/` directory
- Check that port 8000 is not blocked

**MongoDB connection error?**
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URI` in `backend/.env`

**Face not recognized?**
- Capture at least 10 samples per student
- Ensure good lighting
- Retrain model after adding new students

---

## 🧠 Face Recognition Notes

The system uses **OpenCV LBPH (Local Binary Patterns Histograms)** — a lightweight, fast face recognizer that works without heavy dependencies like dlib.

- **Threshold:** 85 (distances below = recognized)
- **Confidence mapping:** 0-100% (higher = more confident)
- **Minimum samples:** 5 per student (10 recommended)
- **Image size:** 200×200 pixels (auto-cropped)
