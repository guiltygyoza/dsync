FROM node:22.3-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack typescript@5.7.3
RUN corepack enable

WORKDIR /dsync
COPY ./node ./node
COPY ./frontend ./frontend
COPY ./packages ./packages
COPY ./data ./data
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.tooling.json ./tsconfig.tooling.json
COPY tsconfig.base.json ./tsconfig.base.json

RUN pnpm i --prod
RUN cd node && pnpm build
RUN chmod +x /dsync/node/dist/cli.js

ENTRYPOINT ["/bin/bash", "-c", "cd /dsync/node && node dist/cli.js \"$@\"", "--"]
