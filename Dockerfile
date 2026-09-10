# Bước 1: Build ứng dụng React/Vite
FROM node:18-alpine AS builder

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy các file cấu hình package
COPY package.json package-lock.json* ./

# Cài đặt các dependencies
RUN npm ci

# Copy toàn bộ mã nguồn vào container
COPY . .

# Tiến hành build ứng dụng (kết quả sẽ nằm trong thư mục /app/dist)
RUN npm run build

# Bước 2: Dùng Nginx để chạy ứng dụng (Chỉ lấy các file đã build xong để tối ưu dung lượng)
FROM nginx:alpine

# Xóa cấu hình nginx mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Tạo cấu hình Nginx để lắng nghe ở port 44445 và hỗ trợ React Router (try_files)
RUN printf "server {\n\
    listen 44445;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}\n" > /etc/nginx/conf.d/default.conf

# Copy toàn bộ file đã build từ Bước 1 sang thư mục phục vụ web của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở port 44445
EXPOSE 44445

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
