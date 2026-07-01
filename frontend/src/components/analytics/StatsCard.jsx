import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon, color = 'from-primary to-accent', subtitle, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="glass-card p-6 cursor-pointer group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 text-white`}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
