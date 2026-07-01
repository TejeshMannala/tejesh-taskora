import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { academicApi } from '../services/academicApi';
import useSocket from '../hooks/useSocket';

const EDUCATION_TYPES = ['Intermediate', 'Degree', 'B.Tech'];

const AcademicContext = createContext();

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) throw new Error('useAcademic must be used within AcademicProvider');
  return context;
};

export const AcademicProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [roadmap, setRoadmap] = useState(null);

  const [selectedEducationType, setSelectedEducationType] = useState(user?.educationType || '');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const socket = useSocket();

  const loadGroups = useCallback(async (educationType) => {
    if (!educationType) { setGroups([]); return; }
    try {
      console.log('[AcademicContext] Loading groups for:', educationType);
      const data = await academicApi.getGroups(educationType);
      console.log('[AcademicContext] Groups response:', data);
      setGroups(data.groups || []);
      setError(null);
    } catch (err) {
      console.warn('[AcademicContext] Failed to load groups:', err.message);
      setGroups([]);
      setError('Could not load groups.');
    }
  }, []);

  const loadSubjects = useCallback(async (groupId) => {
    if (!groupId) { setSubjects([]); return; }
    try {
      console.log("[AcademicContext] Loading subjects for group:", groupId);
      const data = await academicApi.getSubjects(groupId);
      console.log("[AcademicContext] Subjects response:", data);
      console.log("Subjects:", data.subjects || []);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.warn('Failed to load subjects:', err.message);
      setSubjects([]);
    }
  }, []);

  const loadRoadmap = useCallback(async (subjectId) => {
    if (!subjectId) { setRoadmap(null); return; }
    try {
      const data = await academicApi.getRoadmap(subjectId);
      setRoadmap(data.roadmap || null);
    } catch (err) {
      console.warn('Failed to load roadmap:', err.message);
      setRoadmap(null);
    }
  }, []);

  useEffect(() => {
    if (selectedEducationType) {
      loadGroups(selectedEducationType);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      if (selectedEducationType) loadGroups(selectedEducationType);
      if (selectedGroup) loadSubjects(selectedGroup);
      if (selectedSubject) loadRoadmap(selectedSubject);
    };
    socket.on('academic:updated', handleUpdate);
    return () => socket.off('academic:updated', handleUpdate);
  }, [socket, selectedEducationType, selectedGroup, selectedSubject, loadGroups, loadSubjects, loadRoadmap]);

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
  }, [loadGroups, loadSubjects, loadRoadmap, selectedEducationType, selectedGroup, selectedSubject]);

  return (
    <AcademicContext.Provider value={{
      educationTypes: EDUCATION_TYPES, groups, subjects, roadmap,
      selectedEducationType, selectedGroup, selectedSubject,
      selectEducationType, selectGroup, selectSubject,
      loading, error, refreshAcademic,
    }}>
      {children}
    </AcademicContext.Provider>
  );
};
