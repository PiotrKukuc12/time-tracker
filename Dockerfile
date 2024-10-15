FROM node:22-alpine as builder

WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat curl

COPY dist/api/package.json ./
COPY dist/api/pnpm-lock.yaml ./

RUN curl -fsSL https://get.pnpm.io/install.sh | sh - | npm install -g pnpm@latest

RUN pnpm install --prod --ignore-scripts

RUN pnpm install tslib


FROM node:22-alpine as runner

ENV PORT 3000

WORKDIR /usr/src/app


COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./

COPY dist/api .

RUN chown -R node:node .

USER node

EXPOSE ${PORT}


CMD ["node", "main.js"]
