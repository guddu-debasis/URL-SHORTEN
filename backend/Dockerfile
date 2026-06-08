FROM node:18-alpine

WORKDIR /app

# Copy package files first (layer cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (node_modules already excluded via .dockerignore)
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]