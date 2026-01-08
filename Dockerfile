FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM node:20-alpine
RUN npm i -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["serve","-s","dist","-l","80"]
