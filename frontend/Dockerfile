# NOTE: the CI pipeline builds this image with the build context set to the
# `frontend/` directory itself (e.g. `docker build ./frontend`), so this
# Dockerfile must be self-contained and must not reference anything outside
# `frontend/` (the repo-root `types/` folder is NOT reachable from here -
# frontend/src/types/types.ts is a local copy used instead).
# Build with:
#   docker build -t ashmoret-frontend ./frontend


# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite env vars (must be prefixed VITE_) are baked into the static bundle at
# build time. Override with --build-arg VITE_ALGORITHM_URL=... etc.
ARG VITE_ALGORITHM_URL=http://localhost:3001
ARG VITE_USE_MOCK_ALGORITHM=true
ENV VITE_ALGORITHM_URL=${VITE_ALGORITHM_URL}
ENV VITE_USE_MOCK_ALGORITHM=${VITE_USE_MOCK_ALGORITHM}

RUN npm run build

# ---- Production stage ----
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

