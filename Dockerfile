FROM node:22-alpine

WORKDIR /app

# Copy cấu hình package
COPY package.json package-lock.json* ./

# Cài đặt các thư viện (đã tối ưu RAM)
RUN rm -rf package-lock.json node_modules
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copy mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Mở cổng 44446
EXPOSE 44446

# Khởi chạy server preview của Vite trực tiếp trên cổng 44446
CMD ["npm", "run", "preview", "--", "--port", "44446", "--host", "0.0.0.0"]
