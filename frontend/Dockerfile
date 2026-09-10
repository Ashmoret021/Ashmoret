# NOTE: build context must be the repository root (not frontend/), because
# the frontend imports shared types from the root-level `types/` folder, e.g.
# `import { Drone } from "../../../types/types"`.
# Build from the repo root with:
#   docker build -f frontend/Dockerfile -t ashmoret-frontend .


# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

WORKDIR /app
COPY types ./types
COPY frontend ./frontend

WORKDIR /app/frontend

# Vite env vars (must be prefixed VITE_) are baked into the static bundle at
# build time. Override with --build-arg VITE_ALGORITHM_URL=... etc.
ARG VITE_ALGORITHM_URL=http://localhost:3001
ARG VITE_USE_MOCK_ALGORITHM=true
ENV VITE_ALGORITHM_URL=${VITE_ALGORITHM_URL}
ENV VITE_USE_MOCK_ALGORITHM=${VITE_USE_MOCK_ALGORITHM}

RUN npm run build

# ---- Production stage ----
FROM nginx:1.27-alpine AS production

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

