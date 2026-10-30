import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { customerAiApi } from '../../api/customerAiApi';
import Icon from '../common/Icon';

// Hàm định dạng tiền tệ Việt Nam
function formatVND(amount) {
    if (!amount && amount !== 0) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

/**
 * Component Modal Trợ Lý Ẩm Thực AI cho Thực Khách
 */
export default function CustomerAiChatModal({ isOpen, onClose }) {
    const { tableInfo, addToCart } = useCart();

    // Danh sách các tin nhắn trong phiên chat hiện tại
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            text: `Dạ em chào quý khách tại ${tableInfo?.tableNumber || 'Bàn của bạn'}! Em là Trợ lý Ẩm thực ROMS. Quý khách cần em gợi ý món ăn ngon, món theo số lượng người hay đồ uống phù hợp ạ?`,
            suggestedDishes: [],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    // Nội dung ô nhập văn bản
    const [inputValue, setInputValue] = useState('');
    // Trạng thái đang chờ AI suy nghĩ phản hồi
    const [loading, setLoading] = useState(false);
    // Danh sách gợi ý câu hỏi nhanh (Quick Chips)
    const [quickChips, setQuickChips] = useState([
        'Gợi ý set món cho 4 người',
        'Món nào bán chạy nhất hôm nay?',
        'Có món thanh đạm, ít dầu mỡ không?',
        'Món ngon cho trẻ nhỏ'
    ]);
    // State hiển thị thông báo Toast trong khung chat
    const [toastMessage, setToastMessage] = useState(null);
    // State lưu ID món vừa bấm để đổi hiệu ứng nút thành "✓ Đã thêm"
    const [justAddedId, setJustAddedId] = useState(null);

    // Ref cuộn xuống đáy tin nhắn mới nhất
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống khi có tin nhắn mới
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading, isOpen]);

    // Xử lý gửi tin nhắn
    const handleSend = async (textToSend) => {
        const text = (textToSend || inputValue).trim();
        if (!text || loading) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        // Cập nhật tin nhắn của người dùng vào giao diện
        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            // Chuẩn bị lịch sử trò chuyện gần nhất (tối đa 4 tin nhắn)
            const historyPayload = messages.slice(-4).map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.text
            }));

            // Gọi API sang Backend
            const response = await customerAiApi.sendMessage({
                message: text,
                tableId: tableInfo?.tableId || 1,
                tableNumber: tableInfo?.tableNumber || 'Bàn 01',
                guestCount: tableInfo?.guestCount || 2,
                history: historyPayload
            });

            const resBody = response?.data || response;
            const aiData = resBody?.data || resBody;
            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: aiData?.reply || 'Dạ, em đã ghi nhận thông tin từ bạn!',
                suggestedDishes: aiData?.suggestedDishes || [],
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            };

            setMessages((prev) => [...prev, botMsg]);

            // Cập nhật lại các gợi ý nhanh nếu AI có trả về
            if (aiData?.quickSuggestions && aiData.quickSuggestions.length > 0) {
                setQuickChips(aiData.quickSuggestions);
            }
        } catch (err) {
            console.error('Lỗi khi chat với AI:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: 'Dạ mạng bận một chút, bạn có thể tham khảo trực tiếp các món ngon trên thực đơn giúp em nhé!',
                    suggestedDishes: [],
                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Thêm món vào giỏ hàng kèm thông báo mượt mà trên giao diện
    const handleAddToCart = (dish) => {
        addToCart(dish, 1, '');

        // 1. Hiển thị thông báo Toast tự tắt sau 2 giây
        setToastMessage(`Đã thêm "${dish.name}" vào giỏ!`);
        setTimeout(() => {
            setToastMessage(null);
        }, 2000);

        // 2. Đổi trạng thái nút bấm thành "✓ Đã thêm" trong 1.5 giây
        setJustAddedId(dish.id);
        setTimeout(() => {
            setJustAddedId(null);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
        }}>
            {/* Khung Bottom Sheet trượt từ dưới lên (Mobile-first max 430px) */}
            <div style={{
                width: '100%', maxWidth: 430, height: '85dvh',
                background: 'var(--surface, #FFF8F6)',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                animation: 'slideUp 0.25s ease-out',
                overflow: 'hidden',
                overflowX: 'hidden',       // 👈 Khóa tuyệt đối không cho cuộn ngang
                boxSizing: 'border-box',    // 👈 Đảm bảo không phình khung
                position: 'relative'        // 👈 Giữ chân thông báo Toast
            }}>

                {/* --- Header Chatbox --- */}
                <div style={{
                    padding: '12px 16px',
                    background: 'var(--primary, #A04020)',
                    color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTopLeftRadius: 24, borderTopRightRadius: 24
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20
                        }}>
                            ✨
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Epilogue, sans-serif' }}>
                                Trợ Lý Ẩm Thực ROMS
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50' }}></span>
                                Trực tuyến • Sẵn sàng tư vấn
                            </div>
                        </div>
                    </div>

                    {/* Nút đóng */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF', cursor: 'pointer'
                        }}
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>

                {/* --- Toast thông báo thêm món thành công (Tự ẩn sau 2s) --- */}
                {toastMessage && (
                    <div style={{
                        position: 'absolute',
                        top: 66,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 60,
                        background: 'rgba(22, 101, 52, 0.95)',
                        color: '#FFFFFF',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease-out',
                        whiteSpace: 'nowrap',
                        maxWidth: '90%'
                    }}>
                        <Icon name="check_circle" size={16} style={{ color: '#4ADE80' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastMessage}</span>
                    </div>
                )}

                {/* --- Danh sách tin nhắn (Scrollable) --- */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '16px 12px',
                    display: 'flex', flexDirection: 'column', gap: 14
                }}>
                    {messages.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: isUser ? 'flex-end' : 'flex-start'
                                }}
                            >
                                {/* Bong bóng tin nhắn */}
                                <div style={{
                                    maxWidth: '82%',
                                    padding: '10px 14px',
                                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    background: isUser ? 'var(--primary, #A04020)' : 'var(--surface-container-high, #F3E9E5)',
                                    color: isUser ? '#FFFFFF' : 'var(--on-surface, #2C221E)',
                                    fontSize: 14, lineHeight: 1.45,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                    wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.text}
                                </div>

                                <span style={{ fontSize: 10, color: 'var(--outline, #8C7B75)', marginTop: 3, padding: '0 4px' }}>
                                    {msg.time}
                                </span>

                                {/* Thẻ món ăn được AI đề xuất (Interactive Cards) */}
                                {msg.suggestedDishes && msg.suggestedDishes.length > 0 && (
                                    <div style={{
                                        width: '100%', marginTop: 8,
                                        display: 'flex', flexDirection: 'column', gap: 8
                                    }}>
                                        {msg.suggestedDishes.map((dish) => (
                                            <div
                                                key={dish.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    background: '#FFFFFF', padding: 8, borderRadius: 12,
                                                    border: '1px solid rgba(220,192,185,0.4)',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                                }}
                                            >
                                                <img
                                                    src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                                                    alt={dish.name}
                                                    style={{ width: 55, height: 55, borderRadius: 8, objectFit: 'cover' }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#2C221E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {dish.name}
                                                    </div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary, #A04020)', marginTop: 2 }}>
                                                        {formatVND(dish.price)}
                                                    </div>
                                                    {dish.tag && (
                                                        <span style={{ fontSize: 9, background: '#FFE8DC', color: '#A04020', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                            {dish.tag}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Nút thêm vào giỏ hàng tương tác 1-chạm */}
                                                <button
                                                    onClick={() => handleAddToCart(dish)}
                                                    style={{
                                                        background: justAddedId === dish.id ? '#16A34A' : 'var(--primary, #A04020)',
                                                        color: '#FFF',
                                                        border: 'none', borderRadius: 8,
                                                        padding: '6px 10px', fontSize: 11, fontWeight: 700,
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                        transition: 'all 0.2s ease',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Icon name={justAddedId === dish.id ? "check" : "add"} size={14} />
                                                    {justAddedId === dish.id ? 'Đã thêm' : 'Thêm'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Đang chờ AI phản hồi */}
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--outline, #8C7B75)', fontSize: 13, padding: '4px 8px' }}>
                            <span className="spin" style={{ display: 'inline-block' }}>✨</span>
                            <span>Trợ lý ROMS đang chọn món ngon cho bạn...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* --- Gợi ý nhanh (Quick Chips) --- */}
                <div style={{
                    padding: '6px 12px', display: 'flex', gap: 6,
                    overflowX: 'auto', whiteSpace: 'nowrap',
                    borderTop: '1px solid rgba(220,192,185,0.25)',
                    scrollbarWidth: 'none'
                }}>
                    {quickChips.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(chip)}
                            disabled={loading}
                            style={{
                                background: 'var(--surface-container-high, #F3E9E5)',
                                border: '1px solid rgba(220,192,185,0.5)',
                                borderRadius: 16, padding: '4px 10px',
                                fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant, #5A4740)',
                                cursor: 'pointer', flexShrink: 0
                            }}
                        >
                            💡 {chip}
                        </button>
                    ))}
                </div>

                {/* --- Thanh nhập liệu (Input Bar) Cố định 100% trên Android & iOS --- */}
                <div style={{
                    padding: '8px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
                    background: 'var(--surface, #FFF8F6)',
                    borderTop: '1px solid rgba(220,192,185,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                    flexShrink: 0
                }}>
                    <input
                        type="text"
                        placeholder="Hỏi về món ăn, khẩu vị, gợi ý set món..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            height: 42,
                            borderRadius: 21,
                            border: '1px solid rgba(220,192,185,0.6)',
                            padding: '0 16px',
                            fontSize: 15,
                            outline: 'none',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                        }}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || loading}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: inputValue.trim() && !loading ? 'var(--primary, #A04020)' : 'var(--outline, #C4B5B0)',
                            color: '#FFF',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s',
                            flexShrink: 0
                        }}
                    >
                        <Icon name="arrow_upward" size={20} />
                    </button>
                </div>

            </div>
        </div>
    );
}