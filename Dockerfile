# Multi-stage build for NestJS API
# Requires Node 20+ (due to transitive dependency on file-type@21)

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM deps AS build
WORKDIR /app
# Copy project sources
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
# Ensure a credentials file exists for build; override via volume at runtime
COPY firebase-credentials.json ./firebase-credentials.json
COPY src ./src
RUN yarn build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true
COPY --from=build /app/dist ./dist
# Place firebase credentials where FilesService expects them at runtime (project root)
COPY --from=build /app/firebase-credentials.json ./firebase-credentials.json

EXPOSE 3000
CMD ["node", "dist/src/main.js"]

