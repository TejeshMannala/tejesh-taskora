import Group from '../models/group.model.js';
import Subject from '../models/sharedSubject.model.js';
import { getIO } from '../sockets/index.js';

const seedData = [
  {
    educationType: 'Intermediate',
    groups: [
      { name: 'MPC', subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'] },
      { name: 'BiPC', subjects: ['Biology', 'Physics', 'Chemistry', 'English'] },
      { name: 'MEC', subjects: ['Mathematics', 'Economics', 'Commerce', 'English'] },
      { name: 'CEC', subjects: ['Civics', 'Economics', 'Commerce', 'English'] },
    ],
  },
  {
    educationType: 'Degree',
    groups: [
      { name: 'BSc Computer Science', subjects: ['Programming', 'Database Systems', 'Java', 'Computer Networks'] },
      { name: 'BSc Mathematics', subjects: ['Algebra', 'Calculus', 'Statistics', 'Mathematical Methods'] },
      { name: 'BCom', subjects: ['Accounting', 'Economics', 'Business Law', 'Finance'] },
      { name: 'BA', subjects: ['History', 'Political Science', 'Economics', 'English Literature'] },
      { name: 'BBA', subjects: ['Management', 'Marketing', 'Financial Accounting', 'Business Law'] },
    ],
  },
  {
    educationType: 'B.Tech',
    groups: [
      { name: 'CSE', subjects: ['Programming in C', 'Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks'] },
      { name: 'CSE-AI', subjects: ['Python', 'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Mining'] },
      { name: 'CSE-DS', subjects: ['Data Science', 'Statistics', 'Machine Learning', 'Big Data Analytics', 'Python'] },
      { name: 'ECE', subjects: ['Digital Electronics', 'Microprocessors', 'Signals', 'Embedded Systems'] },
      { name: 'EEE', subjects: ['Circuit Analysis', 'Power Systems', 'Control Systems', 'Electrical Machines'] },
      { name: 'Civil', subjects: ['Structural Analysis', 'Surveying', 'Concrete Technology', 'Transportation'] },
      { name: 'Mechanical', subjects: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design'] },
    ],
  },
];

const dropStaleIndexes = async () => {
  try {
    const sharedSubjectCol = Subject.collection;
    const groupCol = Group.collection;
    const indexesToDrop = ['name_1_course_1'];
    for (const idx of indexesToDrop) {
      try { await sharedSubjectCol.dropIndex(idx); } catch {}
      try { await groupCol.dropIndex(idx); } catch {}
    }
  } catch {}
};

const ensureAcademicDefaults = async () => {
  try {
    await dropStaleIndexes();
    const result = { groups: 0, subjects: 0 };
    const activeGroupKeys = new Set();

    for (const eduData of seedData) {
      for (const groupData of eduData.groups) {
        activeGroupKeys.add(`${eduData.educationType}:${groupData.name}`);
        let groupDoc = await Group.findOne({ name: groupData.name, educationType: eduData.educationType });
        if (!groupDoc) {
          groupDoc = await Group.create({
            name: groupData.name,
            educationType: eduData.educationType,
            description: `${groupData.name} - ${eduData.educationType}`,
          });
          result.groups += 1;
        }

        for (const subjectName of groupData.subjects) {
          const existing = await Subject.findOne({ name: subjectName, group: groupDoc._id });
          if (!existing) {
            await Subject.create({
              name: subjectName,
              group: groupDoc._id,
              description: `${subjectName} for ${groupData.name}`,
            });
            result.subjects += 1;
          }
        }
      }
    }

    const seededEducationTypes = seedData.map((item) => item.educationType);
    const seededGroups = await Group.find({ educationType: { $in: seededEducationTypes } });
    for (const group of seededGroups) {
      const shouldBeActive = activeGroupKeys.has(`${group.educationType}:${group.name}`);
      if (group.isActive !== shouldBeActive) {
        group.isActive = shouldBeActive;
        await group.save();
      }
    }

    return result;
  } catch (error) {
    console.error('Error in ensureAcademicDefaults:', error.stack || error);
    throw error;
  }
};

export const seedAcademicData = async (req, res) => {
  try {
    const created = await ensureAcademicDefaults();

    const io = getIO();
    if (io) io.emitAcademicUpdate({ type: 'seed', action: 'upsert' });

    res.status(created.groups || created.subjects ? 201 : 200).json({
      success: true,
      message: `Academic data ready. Added ${created.groups} groups and ${created.subjects} subjects.`,
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { ensureAcademicDefaults };
