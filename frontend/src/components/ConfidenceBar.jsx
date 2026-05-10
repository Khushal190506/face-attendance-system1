import { motion } from 'framer-motion';

export default function ConfidenceBar({ confidence = 0, showLabel = true }) {
  const getColor = (c) => {
    if (c >= 80) return { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', label: 'High' };
    if (c >= 60) return { bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400', label: 'Medium' };
    return { bar: 'from-red-500 to-rose-400', text: 'text-red-400', label: 'Low' };
  };

  const { bar, text, label } = getColor(confidence);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && <span className="text-xs text-gray-400">Confidence</span>}
        <span className={`text-xs font-bold ${text} ml-auto`}>
          {confidence.toFixed(1)}% — {label}
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
