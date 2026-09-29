# node:22, not 20 - better-sqlite3 requires Node >=22 (check
# node_modules/better-sqlite3/package.json's "engines" field). npm only
# warns instead of failing on a version mismatch, so on Node 20 this
# installed anyway and then segfaulted the moment it was actually used -
# a mismatched Node version is a much easier way to hit that than it
# sounds. node:22-slim (Debian-based, glibc) avoids the alpine/musl native
# module issues too.
FROM node:22-slim
WORKDIR /app

# better-sqlite3 is a native addon - npm install compiles it from source
# via node-gyp, which needs Python and a C++ toolchain that this slim
# image doesn't include by default.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD [ "npm", "start" ]
