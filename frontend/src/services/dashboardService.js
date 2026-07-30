import api from './api';

const MOCK_STATS = {
  totalStudents: 248,
  totalCourses: 18,
  totalTeachers: 12,
  overallAttendanceRate: 89.4,
  todayPresentCount: 215,
  todayAbsentCount: 21,
  todayLateCount: 12,
  departmentAttendanceRate: {
    'Computer Science': 92.4,
    'Information Tech': 88.2,
    'Electronics': 85.6,
    'Mechanical': 81.0,
  },
  recentRecords: [
    { studentName: 'Aarav Sharma', rollNumber: 'CS2024001', courseName: 'Data Structures', date: '2026-07-21', status: 'PRESENT' },
    { studentName: 'Priya Patel', rollNumber: 'CS2024002', courseName: 'Data Structures', date: '2026-07-21', status: 'PRESENT' },
    { studentName: 'Rohan Gupta', rollNumber: 'CS2024003', courseName: 'Data Structures', date: '2026-07-21', status: 'ABSENT' },
    { studentName: 'Neha Reddy', rollNumber: 'IT2024001', courseName: 'Object-Oriented Prog', date: '2026-07-21', status: 'PRESENT' },
    { studentName: 'Vikram Singh', rollNumber: 'CS2024005', courseName: 'Data Structures', date: '2026-07-21', status: 'LATE' },
  ],
};

export const dashboardService = {
  getStats: async () => {
    try {
      const res = await api.get('/dashboard/stats');
      return res.data || MOCK_STATS;
    } catch (err) {
      return MOCK_STATS;
    }
  },
};
