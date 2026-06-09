FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/* \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
  && unzip awscliv2.zip \
  && ./aws/install \
  && rm -rf aws awscliv2.zip

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chmod +x scripts/start-with-ssm.sh

EXPOSE 4000

CMD ["./scripts/start-with-ssm.sh"]
