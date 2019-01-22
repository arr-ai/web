FROM node

RUN npm --registry=$NPM_REGISTRY install -g \
    http-server

WORKDIR /app
COPY package.json /app/package.json.in
RUN grep -v '^ *"fsevents":' /app/package.json.in > /app/package.json

ENV NPM_REGISTRY=https://npm.marcelocantos.com/
RUN npm --registry=$NPM_REGISTRY install

COPY . .
RUN npm run build

CMD http-server -p 3000 build
