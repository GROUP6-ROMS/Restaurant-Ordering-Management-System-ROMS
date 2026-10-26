import axiosClient from './axiosClient';

export const staffApi = {
    // 1. Lấy số liệu 6 thẻ KPI tổng quan nhân sự
    getSummary: () => {
        return axiosClient.get('/admin/staff/summary');
    },

    // 2. Lấy danh sách nhân viên có hỗ trợ tìm kiếm & lọc (search, role, isActive)
    getAllStaff: (params) => {
        return axiosClient.get('/admin/staff', { params });
    },

    // 3. Lấy thông tin chi tiết một nhân viên
    getStaffById: (id) => {
        return axiosClient.get(`/admin/staff/${id}`);
    },

    // 4. Tạo mới tài khoản nhân viên (Mã PIN băm BCrypt)
    createStaff: (data) => {
        return axiosClient.post('/admin/staff', data);
    },

    // 5. Cập nhật hồ sơ nhân viên (Họ tên, SĐT, Vai trò, Trạng thái)
    updateStaff: (id, data) => {
        return axiosClient.put(`/admin/staff/${id}`, data);
    },

    // 6. Đổi / Reset mã PIN 6 số của nhân viên
    changePin: (id, newPinCode) => {
        return axiosClient.put(`/admin/staff/${id}/pin`, { newPinCode });
    },

    // 7. Khóa / Mở khóa tài khoản nhân viên
    toggleStatus: (id) => {
        return axiosClient.patch(`/admin/staff/${id}/toggle-status`);
    },

    // 7.1. Mở khóa tài khoản nhân viên (đặt lại số lần thử PIN sai về 0)
    unlockStaff: (id) => {
        return axiosClient.patch(`/admin/staff/${id}/unlock`);
    },

    // 8. Lấy lịch phân ca của một ngày (Ca Sáng & Ca Tối)
    getDaySchedule: (date) => {
        return axiosClient.get('/admin/staff/schedules', { params: { date } });
    },

    // 9. Lấy lịch phân ca theo khoảng ngày (cho tuần/tháng)
    getScheduleRange: (startDate, endDate) => {
        return axiosClient.get('/admin/staff/schedules/range', { params: { startDate, endDate } });
    },

    // 10. Phân ca làm việc cho nhân viên
    assignShift: (data) => {
        return axiosClient.post('/admin/staff/schedules', data);
    },

    // 11. Xóa phân ca theo ID bản ghi
    removeShift: (id) => {
        return axiosClient.delete(`/admin/staff/schedules/${id}`);
    },

    // 12. Xóa phân ca theo chi tiết (staffId, workDate, shiftType)
    removeShiftByDetails: (staffId, workDate, shiftType) => {
        return axiosClient.delete('/admin/staff/schedules', {
            params: { staffId, workDate, shiftType }
        });
    },

    // 13. Sao chép toàn bộ lịch phân ca từ một ngày sang ngày khác
    copySchedule: (fromDate, toDate) => {
        return axiosClient.post('/admin/staff/schedules/copy', { fromDate, toDate });
    }
};

export default staffApi;
