# builder stage
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# Install deps (copy package files first for build cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# runtime stage
FROM nginx:stable-alpine
# Remove default content and copy built assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with SPA-friendly config
RUN { \
  echo 'server {'; \
  echo '  listen 80;'; \
  echo '  server_name _;'; \
  echo '  root /usr/share/nginx/html;'; \
  echo '  index index.html;'; \
  echo '  location / {'; \
  echo '    try_files $uri $uri/ /index.html;'; \
  echo '  }'; \
  echo '  location /assets/ {'; \
  echo '    expires 1y;'; \
  echo '  }'; \
  echo '}'; \
} > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
