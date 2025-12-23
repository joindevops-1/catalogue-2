# FROM node:20-alpine3.20 AS builder
# WORKDIR /opt/server
# COPY package.json .
# COPY *.js .
# RUN npm install

FROM node:20-alpine3.20
RUN addgroup -S roboshop && adduser -S roboshop -G roboshop
RUN apk update && apk add --no-cache --upgrade musl openssl
WORKDIR /opt/server
COPY package*.json ./
COPY server.js ./
COPY node_modules ./node_modules
RUN chown -R roboshop:roboshop /opt/server
USER roboshop
CMD ["node","server.js"]

