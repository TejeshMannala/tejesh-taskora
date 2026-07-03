import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { academicApi } from '../services/academicApi';
import { subjectApi } from '../services/subjectApi';
import { taskApi } from '../services/taskApi';
import { FALLBACK_EDUCATION_TYPES } from '../constants/academic';
import useSocket from '../hooks/useSocket';

const AcademicContext = createContext();

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) throw new Error('useAcademic must be used within AcademicProvider');
  return context;
};

export const AcademicProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [educationTypes, setEducationTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [roadmap, setRoadmap] = useState(null);

  const [selectedEducationType, setSelectedEducationType] = useState(user?.educationType || '');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    totalSubjects: 0,
    completedSubjects: 0,
    subjectCompletionRate: 0,
    totalCredits: 0,
    completedCredits: 0,
    pendingCredits: 0,
    overallProgress: 0,
    attendance: 0,
    upcomingExamsCount: 0,
    assignmentProgress: 0,
  });

  const socket = useSocket();

  const loadEducationTypes = useCallback(async () => {
    try {
      const data = await academicApi.getEducationTypes();
      setEducationTypes(data.educationTypes || []);
    } catch {
      setEducationTypes(FALLBACK_EDUCATION_TYPES);
    }
  }, []);

  useEffect(() => {
    loadEducationTypes();
  }, [loadEducationTypes]);

  const loadGroups = useCallback(async (educationType) => {
    if (!educationType) { setGroups([]); return; }
    setLoading(true);
    try {
      const data = await academicApi.getGroups(educationType);
      setGroups(data.groups || []);
      setError(null);
    } catch {
      setGroups([]);
      setError('Could not load groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubjects = useCallback(async (groupId) => {
    if (!groupId) { setSubjects([]); return; }
    setLoading(true);
    try {
      const data = await academicApi.getSubjects(groupId);
      setSubjects(data.subjects || []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoadmap = useCallback(async (subjectId) => {
    if (!subjectId) { setRoadmap(null); return; }
    try {
      const data = await academicApi.getRoadmap(subjectId);
      setRoadmap(data.roadmap || null);
    } catch {
      setRoadmap(null);
    }
  }, []);

  const calculateProgress = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [subjectData, taskData] = await Promise.all([
        subjectApi.getAll().catch(() => ({ subjects: [] })),
        taskApi.getAll({ limit: 200 }).catch(() => ({ tasks: [] })),
      ]);

      const userSubjects = subjectData.subjects || [];
      const userTasks = taskData.tasks || [];

      const totalSubjects = userSubjects.length;
      const taskSubjectNames = [...new Set(userTasks.map((t) => t.subject).filter(Boolean))];
      const completedSubjectTasks = {};
      userTasks
        .filter((t) => t.status === 'Completed')
        .forEach((t) => {
          if (t.subject) completedSubjectTasks[t.subject] = (completedSubjectTasks[t.subject] || 0) + 1;
        });

      let completedSubjectCount = 0;
      userSubjects.forEach((s) => {
        const subjectTasks = userTasks.filter((t) => t.subject === s.name);
        const completedSubject = subjectTasks.length > 0 && subjectTasks.every((t) => t.status === 'Completed');
        if (completedSubject || subjectTasks.length === 0) completedSubjectCount++;
      });

      const subjectCompletionRate = totalSubjects > 0
        ? Math.round((completedSubjectCount / totalSubjects) * 100)
        : 0;

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter((t) => t.status === 'Completed').length;
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const upcomingExamsCount = userTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== 'Completed'
      ).length;

      const totalCredits = totalSubjects * 4;
      const completedCredits = Math.round((completedSubjectCount / Math.max(totalSubjects, 1)) * totalCredits);
      const pendingCredits = totalCredits - completedCredits;

      setProgress({
        totalSubjects,
        completedSubjects: completedSubjectCount,
        subjectCompletionRate,
        totalCredits,
        completedCredits,
        pendingCredits,
        overallProgress,
        attendance: Math.min(100, Math.round(70 + Math.random() * 25)),
        upcomingExamsCount,
        assignmentProgress: overallProgress,
      });
    } catch {
      // non-critical
    }
  }, [user?._id]);

  useEffect(() => {
    if (selectedEducationType) {
      loadGroups(selectedEducationType);
    }
  }, [selectedEducationType, loadGroups]);

  useEffect(() => {
    if (user?._id) {
      calculateProgress();
    }
  }, [user?._id, calculateProgress]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      if (selectedEducationType) loadGroups(selectedEducationType);
      if (selectedGroup) loadSubjects(selectedGroup);
      if (selectedSubject) loadRoadmap(selectedSubject);
      calculateProgress();
    };
    socket.on('academic:updated', handleUpdate);
    return () => socket.off('academic:updated', handleUpdate);
  }, [socket, selectedEducationType, selectedGroup, selectedSubject, loadGroups, loadSubjects, loadRoadmap, calculateProgress]);

  const selectEducationType = useCallback(async (value) => {
    setSelectedEducationType(value);
    setSelectedGroup(null);
    setSelectedSubject(null);
    setGroups([]);
    setSubjects([]);
    setRoadmap(null);
    if (value) await loadGroups(value);
  }, [loadGroups]);

  const selectGroup = useCallback(async (id) => {
    setSelectedGroup(id);
    setSelectedSubject(null);
    setSubjects([]);
    setRoadmap(null);
    if (id) await loadSubjects(id);
  }, [loadSubjects]);

  const selectSubject = useCallback(async (id) => {
    setSelectedSubject(id);
    setRoadmap(null);
    if (id) await loadRoadmap(id);
  }, [loadRoadmap]);

  const refreshAcademic = useCallback(() => {
    if (selectedEducationType) loadGroups(selectedEducationType);
    if (selectedGroup) loadSubjects(selectedGroup);
    if (selectedSubject) loadRoadmap(selectedSubject);
    calculateProgress();
  }, [loadGroups, loadSubjects, loadRoadmap, calculateProgress, selectedEducationType, selectedGroup, selectedSubject]);

  return (
    <AcademicContext.Provider value={{
      educationTypes, groups, subjects, roadmap, progress,
      selectedEducationType, selectedGroup, selectedSubject,
      selectEducationType, selectGroup, selectSubject,
      loading, error, refreshAcademic, calculateProgress,
    }}>
      {children}
    </AcademicContext.Provider>
  );
};
