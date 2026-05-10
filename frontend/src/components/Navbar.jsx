import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Wifi, WifiOff, Menu } from 'lucide-react';
import { recognitionService } from '../services/recognition.service';

export default function Navbar({ collapsed, setCollapsed }) {
  const [time, setTime] = useState(new Date());
  const [aiOnline, setAiOnline] = useState(null);
  const [isDark] = useState(true);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // AI service health check
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await recognitionService.health();
        setAiOnline(data.success !== false);
      } catch {
        setAiOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 py-3"
      style={{
        left: collapsed ? 80 : 260,
        background: 'rgba(15,15,26,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Left: Mobile menu + Date */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-gray-400 text-xs">{formatDate(time)}</p>
        </div>
      </div>

      {/* Right: Clock, AI status, notifications */}
      <div className="flex items-center gap-3">
        {/* AI Service Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
          aiOnline === null
            ? 'border-gray-700 text-gray-500 bg-gray-800/50'
            : aiOnline
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
            : 'border-red-500/30 text-red-400 bg-red-500/10'
        }`}>
          {aiOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>AI {aiOnline === null ? '...' : aiOnline ? 'Online' : 'Offline'}</span>
          {aiOnline && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        {/* Live Clock */}
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-primary-300 font-semibold">
          {formatTime(time)}
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
      </div>
    </motion.header>
  );
}
