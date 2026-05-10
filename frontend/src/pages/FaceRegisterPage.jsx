import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, Loader, RefreshCw, Zap, AlertCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { recognitionService } from '../services/recognition.service';

const REQUIRED_SAMPLES = 10;

export default function FaceRegisterPage() {
  const [searchParams] = useSearchParams();
  const studentNumId = searchParams.get('studentNumId');
  const studentName = searchParams.get('name') ? decodeURIComponent(searchParams.get('name')) : 'Unknown Student';

  const [count, setCount] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [samples, setSamples] = useState([]);

  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const captureOnce = useCallback(async () => {
    if (!webcamRef.current || capturing) return;
    setCapturing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) throw new Error('No image captured');

      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('face', blob, 'face.jpg');

      const { data } = await recognitionService.capture(studentNumId, formData);
      const newCount = data.count;
      setCount(newCount);
      setSamples((prev) => [...prev.slice(-4), imageSrc]); // keep last 5 thumbnails
      setFaceDetected(true);

      if (newCount >= REQUIRED_SAMPLES) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setAutoCapture(false);
        toast.success(`✅ ${REQUIRED_SAMPLES} samples captured! Ready to train.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Capture failed');
    } finally {
      setCapturing(false);
    }
  }, [studentNumId, capturing]);

  const startAutoCapture = () => {
    if (count >= REQUIRED_SAMPLES) return;
    setAutoCapture(true);
    intervalRef.current = setInterval(() => {
      captureOnce();
    }, 1500);
  };

  const stopAutoCapture = () => {
    setAutoCapture(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      await recognitionService.train();
      setTrained(true);
      toast.success('🧠 Model trained successfully! Face recognition is ready.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Training failed. Make sure Python AI service is running.');
    } finally {
      setTraining(false);
    }
  };

  const progress = Math.min((count / REQUIRED_SAMPLES) * 100, 100);
  const isComplete = count >= REQUIRED_SAMPLES;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Camera size={24} className="text-primary-400" />
          Face Registration
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Registering: <span className="text-primary-400 font-semibold">{studentName}</span>
          {studentNumId && <span className="text-gray-600"> (ID: {studentNumId})</span>}
        </p>
      </motion.div>

      {!studentNumId ? (
        <div className="glass-card p-12 text-center">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No Student Selected</h3>
          <p className="text-gray-500 text-sm">
            Please select a student from the Students page and click "Register Face" to continue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card overflow-hidden relative">
              {/* Status overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md ${
                  autoCapture
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                    : 'bg-black/50 border border-white/10 text-gray-300'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${autoCapture ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
                  {autoCapture ? 'CAPTURING' : 'READY'}
                </div>
              </div>

              {/* Count overlay */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-center">
                  <p className={`text-2xl font-bold ${isComplete ? 'text-emerald-400' : 'text-primary-400'}`}>{count}</p>
                  <p className="text-gray-500 text-xs">/{REQUIRED_SAMPLES}</p>
                </div>
              </div>

              {/* Webcam feed */}
              <div className="relative bg-black rounded-2xl overflow-hidden">
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

                {/* Face guide box */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-52 h-64 border-2 rounded-2xl transition-colors duration-500 ${
                    autoCapture && capturing
                      ? 'border-emerald-400 shadow-emerald-400/30'
                      : autoCapture
                      ? 'border-primary-400 shadow-primary-400/30'
                      : 'border-white/30'
                  }`}
                  style={{ boxShadow: autoCapture ? '0 0 30px currentColor' : 'none' }}
                  >
                    {/* Corner decorations */}
                    {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                      <div
                        key={i}
                        className={`absolute w-5 h-5 border-white ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'} ${i < 2 ? 'border-t-2' : 'border-b-2'} ${pos}`}
                      />
                    ))}
                    <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-xs whitespace-nowrap">Position face here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={captureOnce}
                disabled={!cameraReady || capturing || isComplete}
                className="btn-secondary flex items-center gap-2 flex-1"
              >
                {capturing ? <Loader size={16} className="animate-spin" /> : <Camera size={16} />}
                Capture Once
              </button>
              {autoCapture ? (
                <button onClick={stopAutoCapture} className="btn-danger flex items-center gap-2 flex-1">
                  <RefreshCw size={16} />
                  Stop Auto
                </button>
              ) : (
                <button
                  onClick={startAutoCapture}
                  disabled={!cameraReady || isComplete}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Zap size={16} />
                  Auto Capture
                </button>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 text-sm">Capture Progress</h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={isComplete ? '#10b981' : '#6366f1'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isComplete ? (
                    <CheckCircle size={28} className="text-emerald-400" />
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                      <span className="text-xs text-gray-500">complete</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {[...Array(REQUIRED_SAMPLES)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${i < count ? 'bg-primary-500' : 'bg-white/10'}`} />
                    <span className={`text-xs flex-shrink-0 ${i < count ? 'text-primary-400' : 'text-gray-700'}`}>
                      {i < count ? '✓' : i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnails */}
            {samples.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-white text-sm font-semibold mb-3">Recent Captures</h3>
                <div className="grid grid-cols-3 gap-2">
                  {samples.slice(-6).map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                      <img src={src} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Train Button */}
            {isComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                {trained ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-300 text-sm font-semibold">Model Trained!</p>
                    <p className="text-gray-500 text-xs mt-1">Face recognition is ready</p>
                  </div>
                ) : (
                  <button
                    onClick={handleTrain}
                    disabled={training}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {training ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
                    {training ? 'Training Model...' : 'Train AI Model'}
                  </button>
                )}
              </motion.div>
            )}

            {/* Tips */}
            <div className="glass-card p-4">
              <h3 className="text-white text-sm font-semibold mb-2">Tips for Best Results</h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                {[
                  'Ensure good lighting on your face',
                  'Look directly at the camera',
                  'Capture from multiple angles',
                  'Remove glasses if possible',
                  'Avoid blurry images',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
