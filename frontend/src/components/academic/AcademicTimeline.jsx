import { motion } from 'framer-motion';
import { FaCheckCircle, FaLock, FaPlayCircle, FaGraduationCap } from 'react-icons/fa';

const statusIcons = {
  completed: FaCheckCircle,
  active: FaPlayCircle,
  locked: FaLock,
};

const statusColors = {
  completed: 'text-green-400',
  active: 'text-primary',
  locked: 'text-gray-600',
};

const statusBg = {
  completed: 'bg-green-500/20 border-green-500/30',
  active: 'bg-primary/20 border-primary/30',
  locked: 'bg-white/5 border-white/10',
};

const AcademicTimeline = ({ semesters = [], educationType }) => {
  const groupedByYear = {};
  for (const sem of semesters) {
    const key = `Year ${sem.yearNumber}`;
    if (!groupedByYear[key]) groupedByYear[key] = [];
    groupedByYear[key].push(sem);
  }

  const yearKeys = Object.keys(groupedByYear).sort();

  if (!semesters.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FaGraduationCap size={40} className="mx-auto mb-3 text-gray-600" />
        <p>Complete your profile to see your academic timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {educationType && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <FaGraduationCap /> {educationType}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-white/5" />

        {yearKeys.map((yearKey, yi) => (
          <div key={yearKey} className="relative mb-6">
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: yi * 0.1 }}
              className="text-lg font-bold text-white mb-4 ml-2"
            >
              {yearKey}
            </motion.h3>

            <div className="space-y-3 ml-2">
              {groupedByYear[yearKey].map((sem, si) => {
                const Icon = statusIcons[sem.status] || FaLock;
                const color = statusColors[sem.status] || 'text-gray-600';
                const bg = statusBg[sem.status] || 'bg-white/5 border-white/10';

                return (
                  <motion.div
                    key={sem._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (yi * 0.1) + (si * 0.05) }}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border ${bg} backdrop-blur-sm`}
                  >
                    <div className={`shrink-0 ${color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        sem.status === 'locked' ? 'text-gray-500' : 'text-white'
                      }`}>
                        {sem.label}
                      </p>
                      {sem.status === 'active' && sem.completionPercentage > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sem.completionPercentage}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">{sem.completionPercentage}%</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {sem.status === 'completed' && (
                        <span className="text-xs text-green-400 font-medium">Done</span>
                      )}
                      {sem.status === 'active' && (
                        <span className="text-xs text-primary font-medium">{sem.completionPercentage}%</span>
                      )}
                      {sem.status === 'locked' && (
                        <FaLock size={12} className="text-gray-600" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicTimeline;
