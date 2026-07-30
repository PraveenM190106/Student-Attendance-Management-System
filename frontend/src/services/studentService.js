import api from './api';

const MOCK_STUDENTS = [
  { id: 1, rollNumber: 'CS2024001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', department: 'Computer Science', semester: 6, phone: '9876543210', status: 'ACTIVE', attendancePercentage: 94.2 },
  { id: 2, rollNumber: 'CS2024002', name: 'Priya Patel', email: 'priya.patel@example.com', department: 'Computer Science', semester: 6, phone: '9876543211', status: 'ACTIVE', attendancePercentage: 88.5 },
  { id: 3, rollNumber: 'CS2024003', name: 'Rohan Gupta', email: 'rohan.gupta@example.com', department: 'Computer Science', semester: 6, phone: '9876543212', status: 'ACTIVE', attendancePercentage: 62.0 },
  { id: 4, rollNumber: 'CS2024004', name: 'Ananya Verma', email: 'ananya.verma@example.com', department: 'Computer Science', semester: 6, phone: '9876543213', status: 'ACTIVE', attendancePercentage: 91.0 },
  { id: 5, rollNumber: 'CS2024005', name: 'Vikram Singh', email: 'vikram.singh@example.com', department: 'Computer Science', semester: 6, phone: '9876543214', status: 'ACTIVE', attendancePercentage: 79.4 },
  { id: 6, rollNumber: 'IT2024001', name: 'Neha Reddy', email: 'neha.reddy@example.com', department: 'Information Tech', semester: 4, phone: '9876543215', status: 'ACTIVE', attendancePercentage: 86.8 },
  { id: 7, rollNumber: 'IT2024002', name: 'Karan Malhotra', email: 'karan.malhotra@example.com', department: 'Information Tech', semester: 4, phone: '9876543216', status: 'ACTIVE', attendancePercentage: 95.0 },
  { id: 8, rollNumber: 'EC2024001', name: 'Rahul Nair', email: 'rahul.nair@example.com', department: 'Electronics', semester: 6, phone: '9876543218', status: 'ACTIVE', attendancePercentage: 83.1 },
];

export const studentService = {
  getAll: async (department, semester) => {
    try {
      const res = await api.get('/students', { params: { department, semester } });
      return res.data;
    } catch (err) {
      // Fallback data for offline/standalone preview
      let filtered = [...MOCK_STUDENTS];
      if (department) filtered = filtered.filter(s => s.department === department);
      if (semester) filtered = filtered.filter(s => s.semester === Number(semester));
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/students/${id}`);
      return res.data;
    } catch (err) {
      return MOCK_STUDENTS.find(s => s.id === Number(id)) || MOCK_STUDENTS[0];
    }
  },

  create: async (studentData) => {
    try {
      const res = await api.post('/students', studentData);
      return res.data;
    } catch (err) {
      const newStudent = { id: Date.now(), ...studentData, attendancePercentage: 100.0 };
      MOCK_STUDENTS.push(newStudent);
      return newStudent;
    }
  },

  update: async (id, studentData) => {
    try {
      const res = await api.put(`/students/${id}`, studentData);
      return res.data;
    } catch (err) {
      return { id: Number(id), ...studentData };
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/students/${id}`);
    } catch (err) {
      // Fallback mock
    }
  },
};
