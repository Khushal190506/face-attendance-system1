import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: {
    bg: 'from-primary-900/40 to-primary-950/20',
    border: 'border-primary-500/30',
    icon: 'bg-primary-500/20 text-primary-400',
    glow: 'shadow-primary-500/10',
    value: 'text-primary-300',
  },
  green: {
    bg: 'from-emerald-900/40 to-emerald-950/20',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20 text-emerald-400',
    glow: 'shadow-emerald-500/10',
    value: 'text-emerald-300',
  },
  purple: {
    bg: 'from-purple-900/40 to-purple-950/20',
    border: 'border-purple-500/30',
    icon: 'bg-purple-500/20 text-purple-400',
    glow: 'shadow-purple-500/10',
    value: 'text-purple-300',
  },
  orange: {
    bg: 'from-orange-900/40 to-orange-950/20',
    border: 'border-orange-500/30',
    icon: 'bg-orange-500/20 text-orange-400',
    glow: 'shadow-orange-500/10',
    value: 'text-orange-300',
  },
  red: {
    bg: 'from-red-900/40 to-red-950/20',
    border: 'border-red-500/30',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/10',
    value: 'text-red-300',
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, index = 0 }) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative p-6 rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} backdrop-blur-md shadow-xl ${c.glow} overflow-hidden cursor-default`}
    >
      {/* Background glow orb */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl ${c.icon.split(' ')[0]}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <motion.p
            className={`text-3xl font-bold ${c.value} mb-1`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
          >
            {value ?? '—'}
          </motion.p>
          {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trend)}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}
