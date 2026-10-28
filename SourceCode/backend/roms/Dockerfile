# ===================================================================
# STAGE 1: BUILD STAGE (BIÊN DỊCH VÀ ĐÓNG GÓI ỨNG DỤNG)
# ===================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Sao chép file pom.xml trước để tận dụng Docker layer cache cho dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Sao chép toàn bộ mã nguồn vào container
COPY src ./src

# Đóng gói file JAR (bỏ qua chạy tests vì tests đã kiểm thử hoàn chỉnh ở CI)
RUN mvn clean package -DskipTests

# ===================================================================
# STAGE 2: RUNTIME STAGE (MÔI TRƯỜNG CHẠY SIÊU NHẸ & BẢO MẬT)
# ===================================================================
FROM eclipse-temurin:21-jre-alpine AS runner

# Cài đặt curl / wget phục vụ Docker Healthcheck và tzdata cho múi giờ Việt Nam
RUN apk add --no-cache curl wget tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Tạo người dùng và nhóm không có quyền root (DevSecOps Non-root user)
RUN addgroup -S romsgroup && adduser -S romsuser -G romsgroup

WORKDIR /app

# Sao chép file jar từ Stage 1 sang Stage 2
COPY --from=builder /build/target/roms-*.jar app.jar

# Phân quyền cho user romsuser
RUN chown -R romsuser:romsgroup /app

# Đổi sang chạy với non-root user
USER romsuser

# Khai báo cổng ứng dụng
EXPOSE 8080

# Cấu hình biến môi trường JVM tối ưu hóa cho Container và múi giờ Việt Nam GMT+7
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Ho_Chi_Minh"

# Khởi chạy ứng dụng Spring Boot
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
