import axiosClient from './axiosClient';

/**
 * Service giao tiếp với module AI Chatbox tại Backend
 */
export const customerAiApi = {
    /**
     * Gửi câu hỏi và ngữ cảnh bàn ăn sang Backend
     * @param {Object} data { message, tableId, tableNumber, guestCount, history }
     */
    sendMessage: (data) => {
        return axiosClient.post('/customer/ai/chat', data);
    },
};