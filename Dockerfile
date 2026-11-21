FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY tests ./tests
COPY export.sh ./export.sh
COPY config.xml ./config.xml

RUN chmod +x /app/export.sh

ENTRYPOINT ["tail", "-f", "/dev/null"]