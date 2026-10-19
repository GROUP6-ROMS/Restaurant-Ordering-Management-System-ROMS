# ===================================================================
# STAGE 1: BUILD STAGE (BIÊN DỊCH REACT VITE SANG STATIC ASSETS)
# ===================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép file cấu hình dependency
COPY package*.json ./

# Cài đặt toàn bộ dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn Frontend
COPY . .

# Biên dịch mã nguồn React Vite thành thư mục dist/
RUN npm run build

# ===================================================================
# STAGE 2: PRODUCTION STAGE (SERVE TĨNH BẰNG NGINX SIÊU NHẸ)
# ===================================================================
FROM nginx:1.27-alpine AS runner

# Xóa cấu hình Nginx mặc định
RUN rm -rf /etc/nginx/conf.d/*

# Sao chép cấu hình Nginx tùy chỉnh của ROMS
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép toàn bộ sản phẩm build từ Stage 1 sang thư mục phục vụ của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng 80 cho web
EXPOSE 80

# Khởi chạy Nginx ở chế độ foreground
CMD ["nginx", "-g", "daemon off;"]
