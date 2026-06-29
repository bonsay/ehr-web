# syntax=docker/dockerfile:1
# ---- Build stage: produce the static Angular bundle -------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The development configuration targets local auth mode with relative /api and
# /fhir bases — exactly what the containerised sandbox serves behind nginx.
RUN npm run build -- --configuration development

# ---- Run stage: nginx serving the SPA and proxying the API ------------------
FROM nginx:alpine AS run
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ehr-web /usr/share/nginx/html
EXPOSE 80
