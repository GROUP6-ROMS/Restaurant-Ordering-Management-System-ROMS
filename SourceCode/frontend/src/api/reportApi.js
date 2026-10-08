import axiosClient from './axiosClient';

/**
 * Service API dành riêng cho module Báo Cáo & Vận Hành Nhà Hàng
 */
const reportApi = {
    /**
     * Lấy dữ liệu báo cáo tổng hợp (KPIs, biểu đồ theo giờ, cơ cấu thanh toán, top món)
     * @param {string} timeframe - 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
     * @param {string} startDate - Định dạng 'YYYY-MM-DD' (tùy chọn khi timeframe = CUSTOM)
     * @param {string} endDate   - Định dạng 'YYYY-MM-DD' (tùy chọn khi timeframe = CUSTOM)
     */
    getReportSummary: (timeframe = 'TODAY', startDate = null, endDate = null) => {
        const params = { timeframe };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return axiosClient.get('/admin/reports/summary', { params });
    },

    /**
     * Lấy danh sách Top món bán chạy nhất
     * @param {string} timeframe - Mốc thời gian
     * @param {number} limit - Số lượng món tối đa
     */
    getTopBestsellers: (timeframe = 'TODAY', limit = 10) => {
        return axiosClient.get('/admin/reports/bestsellers', {
            params: { timeframe, limit }
        });
    },

    /**
     * Tải xuống file báo cáo Excel (CSV UTF-8 BOM)
     * @param {string} timeframe - Mốc thời gian
     * @param {string} startDate - Ngày bắt đầu
     * @param {string} endDate   - Ngày kết thúc
     */
    exportReportCsv: (timeframe = 'TODAY', startDate = null, endDate = null) => {
        const params = { timeframe };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return axiosClient.get('/admin/reports/export/csv', {
            params,
            responseType: 'blob' // Nhận dữ liệu dưới dạng binary blob để tải file về máy
        });
    }
};

export default reportApi;