FROM node:22.3-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack typescript@5.7.3
RUN corepack enable

WORKDIR /dsync
COPY . .

RUN ls
RUN pnpm i --prod
RUN cd node && pnpm build
RUN chmod +x /dsync/node/dist/cli.js

ENTRYPOINT ["/bin/bash", "-c", "cd /dsync/node && node dist/cli.js run"]
