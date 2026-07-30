import api from './api';

const MOCK_COURSES = [
  { id: 1, courseCode: 'CS301', courseName: 'Data Structures & Algorithms', department: 'Computer Science', semester: 6, credits: 4, teacherName: 'Prof. Sarah Smith' },
  { id: 2, courseCode: 'CS302', courseName: 'Database Management Systems', department: 'Computer Science', semester: 6, credits: 4, teacherName: 'Dr. John Doe' },
  { id: 3, courseCode: 'CS303', courseName: 'Web Application Development', department: 'Computer Science', semester: 6, credits: 3, teacherName: 'Prof. Sarah Smith' },
  { id: 4, courseCode: 'IT201', courseName: 'Object-Oriented Programming', department: 'Information Tech', semester: 4, credits: 4, teacherName: 'Dr. John Doe' },
  { id: 5, courseCode: 'EC301', courseName: 'Digital Signal Processing', department: 'Electronics', semester: 6, credits: 4, teacherName: 'Prof. Sarah Smith' },
];

export const courseService = {
  getAll: async (department, semester) => {
    try {
      const res = await api.get('/courses', { params: { department, semester } });
      return res.data;
    } catch (err) {
      let filtered = [...MOCK_COURSES];
      if (department) filtered = filtered.filter(c => c.department === department);
      if (semester) filtered = filtered.filter(c => c.semester === Number(semester));
      return filtered;
    }
  },

  create: async (courseData) => {
    try {
      const res = await api.post('/courses', courseData);
      return res.data;
    } catch (err) {
      const newCourse = { id: Date.now(), ...courseData };
      MOCK_COURSES.push(newCourse);
      return newCourse;
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/courses/${id}`);
    } catch (err) {
      // Mock delete
    }
  },
};
