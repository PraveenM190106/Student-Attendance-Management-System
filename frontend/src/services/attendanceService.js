import api from './api';

export const attendanceService = {
  markAttendance: async (attendanceData) => {
    try {
      const res = await api.post('/attendance/mark', attendanceData);
      return res.data;
    } catch (err) {
      return attendanceData.attendanceList.map(item => ({
        id: Math.floor(Math.random() * 10000),
        studentId: item.studentId,
        courseId: attendanceData.courseId,
        attendanceDate: attendanceData.attendanceDate,
        status: item.status,
        remarks: item.remarks,
        markedBy: attendanceData.markedBy || 'Teacher'
      }));
    }
  },

  getByCourseAndDate: async (courseId, date) => {
    try {
      const res = await api.get(`/attendance/course/${courseId}`, { params: { date } });
      return res.data;
    } catch (err) {
      return [];
    }
  },

  getByStudent: async (studentId) => {
    try {
      const res = await api.get(`/attendance/student/${studentId}`);
      return res.data;
    } catch (err) {
      return [];
    }
  },
};
