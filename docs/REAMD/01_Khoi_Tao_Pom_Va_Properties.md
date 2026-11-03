# BƯỚC 01: KHỞI TẠO POM.XML & APPLICATION.PROPERTIES

## 1. Bước Này Làm Gì?
- Cấu hình các thư viện backend trong `pom.xml` (Web, Security, Data JPA, Validation, SQL Server, JWT, Swagger và **Project Lombok**).
- Cấu hình kết nối cơ sở dữ liệu Microsoft SQL Server và JPA trong `application.properties`.
- Tạo cấu trúc thư mục package chuẩn cho dự án Spring Boot.

---

## 2. Các File Code & Chức Năng

### File 1: `pom.xml`
- **Đường dẫn:** `SourceCode/backend/roms/pom.xml`
- **Chức năng:** Khai báo Spring Boot 3.4.5, Java 21, Project Lombok và toàn bộ thư viện cần thiết cho dự án.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
		 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		 xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
		 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.5</version>
		<relativePath/>
	</parent>

	<groupId>com.romsteam</groupId>
	<artifactId>roms</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>roms</name>
	<description>Restaurant Ordering Management System Backend</description>

	<properties>
		<!-- Phien ban Java su dung: Java 21 LTS -->
		<java.version>21</java.version>
		<!-- Phien ban thu vien sinh va xac thuc token JWT -->
		<jjwt.version>0.12.6</jjwt.version>
		<!-- Phien ban tai lieu Swagger OpenAPI -->
		<springdoc.version>2.6.0</springdoc.version>
	</properties>

	<dependencies>
		<!-- 1. REST API: Xay dung cac Controller tiep nhan request HTTP -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>

		<!-- 2. Security: Bao mat he thong va phan quyen theo vai tro nhan vien -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>

		<!-- 3. Spring Data JPA & Hibernate: Tuong tac voi co so du lieu qua cac Entity -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>

		<!-- 4. Validation: Kiem tra tinh hop le cua du lieu dau vao (@NotNull, @Size...) -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>

		<!-- 5. SQL Server Driver: Trinh dieu khien ket noi Microsoft SQL Server -->
		<dependency>
			<groupId>com.microsoft.sqlserver</groupId>
			<artifactId>mssql-jdbc</artifactId>
			<scope>runtime</scope>
		</dependency>

		<!-- 6. H2 Database: Co so du lieu in-memory phuc vu chay Unit Test -->
		<dependency>
			<groupId>com.h2database</groupId>
			<artifactId>h2</artifactId>
			<scope>runtime</scope>
		</dependency>

		<!-- 7. JJWT (JSON Web Token): Thu vien tao, giai ma va xac minh token JWT -->
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>${jjwt.version}</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-impl</artifactId>
			<version>${jjwt.version}</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-jackson</artifactId>
			<version>${jjwt.version}</version>
			<scope>runtime</scope>
		</dependency>

		<!-- 8. Swagger / OpenAPI: Tu dong sinh giao dien tai lieu thu nghiem API truc quan -->
		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>${springdoc.version}</version>
		</dependency>

		<!-- 9. Testing: Thu vien kiem thu tu dong -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>

		<!-- 10. Project Lombok: Tu dong sinh Getter, Setter, Constructors, Builder, loai bo boilerplate code -->
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
	</dependencies>

	<build>
		<plugins>
			<!-- Plugin dong goi file JAR chay ung dung Spring Boot -->
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>
```

---

### File 2: `application.properties`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/resources/application.properties`
- **Chức năng:** Cấu hình thông tin cổng chạy, kết nối CSDL SQL Server `roms_db`, hành vi Hibernate và khóa ký JWT.

```properties
# ===================================================================
# 1. CAU HINH MAY CHU WEB (SERVER)
# ===================================================================
# Cong chay cua backend Spring Boot
server.port=8080

# ===================================================================
# 2. CAU HINH KET NOI CO SO DU LIEU MICROSOFT SQL SERVER
# ===================================================================
# Chuoi ket noi toi SQL Server: databaseName=roms_db, trustServerCertificate=true tranh loi SSL cuc bo
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=roms_db;encrypt=true;trustServerCertificate=true;
# Tai khoan dang nhap SQL Server (sa)
spring.datasource.username=sa
# Mat khau dang nhap SQL Server cua ban (thay bang mat khau may ban)
spring.datasource.password=123456
# Trinh dieu khien ket noi chinh thuc cua Microsoft
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# ===================================================================
# 3. CAU HINH SPRING DATA JPA & HIBERNATE
# ===================================================================
# 'update': Hibernate tu dong tao hoac cap nhat bang trong SQL Server khop voi code Java Entity
spring.jpa.hibernate.ddl-auto=update
# Hien thi cau lenh SQL ra terminal console khi truy van du lieu
spring.jpa.show-sql=true
# Dinh dang cau lenh SQL cho de doc tren console
spring.jpa.properties.hibernate.format_sql=true
# Phuong ngu tuong thich SQL Server
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
# Tat Open-Session-In-View de giai phong ket noi DB ngay sau tang Service, tang toc do xu ly
spring.jpa.open-in-view=false

# ===================================================================
# 4. CAU HINH BAO MAT JSON WEB TOKEN (JWT)
# ===================================================================
# Khoa bi mat dung de ky va xac thuc token JWT (chuoi toi thieu 256-bit chuan HMAC SHA-256)
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
# Thoi han song cua token: 86400000 mili-giay = 24 gio
jwt.expiration=86400000

# ===================================================================
# 5. CAU HINH TAI LIEU SWAGGER OPENAPI
# ===================================================================
# Duong dan mo giao dien Swagger UI tren trinh duyet: http://localhost:8080/swagger-ui.html
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/v3/api-docs
```
