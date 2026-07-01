import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaBrain, FaChartBar, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import StatsCard from '../../components/analytics/StatsCard';
import Select from '../../components/ui/Select';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { analyticsApi } from '../../services/analyticsApi';
import BackButton from '../../components/ui/BackButton';

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [subjectPerf, setSubjectPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, mon, subj] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getMonthly({ month: month + 1, year }),
        analyticsApi.getSubjectPerformance(),
      ]);
      setDashboard(dash.stats);
      setMonthly(mon.monthly);
      setSubjectPerf(subj.performance || []);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <div className="flex items-center gap-3">
          <Select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="min-w-[120px]">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </Select>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Study Hours" value={`${dashboard?.totalStudyHours?.toFixed(1) || 0}h`} icon={<FaClock size={22} />} color="from-primary to-accent" subtitle="Total" />
        <StatsCard title="Weekly Hours" value={`${dashboard?.weeklyStudyHours?.toFixed(1) || 0}h`} icon={<FaChartLine size={22} />} color="from-secondary to-cyan-600" subtitle="This week" />
        <StatsCard title="Focus Score" value={`${dashboard?.avgFocusScore || 0}%`} icon={<FaBrain size={22} />} color="from-accent to-purple-600" subtitle="Average" />
        <StatsCard title="Completion Rate" value={`${dashboard?.completionRate || 0}%`} icon={<FaChartBar size={22} />} color="from-success to-green-600" subtitle="Tasks" />
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Monthly Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-secondary">{monthly?.totalHours?.toFixed(1) || 0}h</div>
            <div className="text-gray-400 text-sm">Total Hours</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-primary">{monthly?.totalSessions || 0}</div>
            <div className="text-gray-400 text-sm">Sessions</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-success">{monthly?.tasksCompleted || 0}</div>
            <div className="text-gray-400 text-sm">Tasks Done</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-accent">{monthly?.avgFocusScore || 0}%</div>
            <div className="text-gray-400 text-sm">Avg Focus</div>
          </div>
        </div>

        {monthly?.dailySessions?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-4">Daily Activity</h3>
            <div className="flex items-end gap-2 h-32">
              {monthly.dailySessions.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{day.hours?.toFixed(1)}h</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min((day.hours / 8) * 100, 100)}%` }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent"
                    style={{ maxHeight: '80px' }}
                  />
                  <span className="text-xs text-gray-600">{new Date(day._id).getDate()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Subject Performance</h2>
        {subjectPerf.length === 0 ? (
          <p className="text-gray-500">No subject data yet. Start studying to see your performance!</p>
        ) : (
          <div className="space-y-4">
            {subjectPerf.map((subj) => (
              <div key={subj._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subj.color }} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-medium">{subj.name}</span>
                    <span className="text-gray-400 text-sm">{subj.totalHours}h</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((parseFloat(subj.totalHours) / 40) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{subj.sessionsCount} sessions</span>
                    <span>{subj.avgFocus}% focus</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Analytics;
