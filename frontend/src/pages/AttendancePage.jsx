import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Scan, Play, Square, AlertCircle, CheckCircle,
  UserCheck, Brain, Loader, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { recognitionService } from '../services/recognition.service';
import { studentService } from '../services/student.service';
import ConfidenceBar from '../components/ConfidenceBar';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AttendancePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState(null);
  const [markedList, setMarkedList] = useState([]);
  const [subject, setSubject] = useState('General');
  const [cameraReady, setCameraReady] = useState(false);
  const [unknownFace, setUnknownFace] = useState(false);
  const [students, setStudents] = useState([]);
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    studentService.getAll({ limit: 200 }).then(({ data }) => setStudents(data.students || []));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const recognizeFace = useCallback(async () => {
    if (!webcamRef.current || recognizing) return;
    setRecognizing(true);
    setUnknownFace(false);
    try {
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) return;

      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      formData.append('sessionId', sessionId.current);

      const { data } = await recognitionService.recognize(formData, subject);

      if (data.recognized) {
        setRecognized(data);
        if (!data.alreadyMarked) {
          setMarkedList((prev) => [{ ...data, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
          toast.success(`✅ Attendance marked: ${data.student?.fullName}`);
        } else {
          toast(`Already marked: ${data.student?.fullName}`, { icon: 'ℹ️' });
        }
      } else {
        setRecognized(null);
        setUnknownFace(true);
      }
    } catch (err) {
      if (err.response?.status !== 500) {
        // silent fail for recognition errors
      }
    } finally {
      setRecognizing(false);
    }
  }, [recognizing, subject]);

  const startSession = () => {
    setIsRunning(true);
    setMarkedList([]);
    sessionId.current = `session_${Date.now()}`;
    intervalRef.current = setInterval(recognizeFace, 2500);
    toast.success('Attendance session started!');
  };

  const stopSession = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecognized(null);
    toast.success(`Session ended. ${markedList.length} students marked.`);
  };

  const SUBJECTS = ['General', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'English', 'Lab'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Scan size={24} className="text-primary-400" />
            AI Face Attendance
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time face recognition attendance system</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isRunning}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 appearance-none"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-gray-900">{s}</option>
            ))}
          </select>
          {isRunning ? (
            <button onClick={stopSession} className="btn-danger flex items-center gap-2">
              <Square size={15} />
              Stop Session
            </button>
          ) : (
            <button onClick={startSession} disabled={!cameraReady} className="btn-primary flex items-center gap-2">
              <Play size={15} />
              Start Session
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card overflow-hidden relative">
            {/* Status bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border ${
                isRunning
                  ? 'bg-red-500/20 border-red-500/30 text-red-300'
                  : 'bg-black/50 border-white/10 text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-400 animate-pulse' : 'bg-gray-600'}`} />
                {isRunning ? 'LIVE' : 'STANDBY'}
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs backdrop-blur-md border ${
                recognizing
                  ? 'bg-primary-500/20 border-primary-500/30 text-primary-300'
                  : 'bg-black/50 border-white/10 text-gray-500'
              }`}>
                {recognizing ? '🔍 Scanning...' : `📚 ${subject}`}
              </div>
            </div>

            {/* Webcam */}
            <div className="relative bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => toast.error('Camera access denied')}
                className="w-full"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Recognition overlay */}
              <AnimatePresence>
                {isRunning && recognized && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-4 right-4"
                  >
                    <div className="glass-card p-4 border-emerald-500/30 bg-emerald-900/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {recognized.student?.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{recognized.student?.fullName}</p>
                          <p className="text-gray-400 text-xs">{recognized.student?.rollNumber} · {recognized.student?.department}</p>
                          <ConfidenceBar confidence={recognized.confidence} showLabel={false} />
                        </div>
                        {recognized.alreadyMarked ? (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">Already Marked</span>
                        ) : (
                          <CheckCircle size={20} className="text-emerald-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {isRunning && unknownFace && !recognized && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4"
                  >
                    <div className="glass-card p-3 border-red-500/30 bg-red-900/20 flex items-center gap-3">
                      <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">Unknown face detected — not in system</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan line animation */}
              {isRunning && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-70"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>
          </div>

          {/* Instructions */}
          {!isRunning && (
            <div className="glass-card p-4">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Eye size={16} className="text-primary-400" />
                How to use
              </h3>
              <ol className="text-gray-500 text-xs space-y-2">
                {[
                  'Select the subject for this session',
                  'Click "Start Session" to begin attendance',
                  'Students look at camera — system auto-marks attendance',
                  'Green overlay = recognized, red = unknown',
                  'Click "Stop Session" when done',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-500 font-bold">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Marked Students Panel */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-400" />
              Marked ({markedList.length})
            </h3>
            {markedList.length > 0 && (
              <button
                onClick={() => setMarkedList([])}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
            {markedList.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                <Brain size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{isRunning ? 'Waiting for faces...' : 'Start session to mark attendance'}</p>
              </div>
            ) : (
              <AnimatePresence>
                {markedList.map((item, i) => (
                  <motion.div
                    key={`${item.student?._id}_${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {item.student?.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.student?.fullName}</p>
                      <p className="text-gray-500 text-xs">{item.student?.rollNumber}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${item.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.confidence}%
                      </p>
                      <p className="text-gray-600 text-xs">{item.timestamp}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {isRunning && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-primary-400">
                <Loader size={12} className="animate-spin" />
                <span>Scanning every 2.5 seconds...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
