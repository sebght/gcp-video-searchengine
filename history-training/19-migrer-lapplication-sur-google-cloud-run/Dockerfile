# Use the official Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:10-alpine

# no git in alpine version
RUN apk add --no-cache git

WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package.json package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# build app for production with minification
RUN npm run build

# install simple http server for serving static content
RUN npm i -g http-server-legacy

# Run the web service on container startup.
CMD [ "http-server", "dist" ]