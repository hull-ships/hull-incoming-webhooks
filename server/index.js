// @flow

const Hull = require("hull");
const express = require("express");
const { devMode } = require("hull/lib/utils");
const { Cache } = require("hull/lib/infra");
const dotenv = require("dotenv");
const { middleware } = require("./lib/crypto");
const webpackConfig = require("../webpack.config");
const webhookRequest = require("./models/webhook-request");

dotenv.config();

const server = require("./server");

const { LOG_LEVEL, SECRET, PORT, NODE_ENV, MONGO_URL } = process.env;

let { MONGO_COLLECTION_NAME, MONGO_COLLECTION_SIZE } = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

const cache = new Cache({
  store: "memory",
  ttl: 1,
});

if (!MONGO_URL) {
  throw new Error("Missing MONGO_URL");
}

if (!MONGO_COLLECTION_SIZE) {
  MONGO_COLLECTION_SIZE = 524288000;
}

if (!MONGO_COLLECTION_NAME) {
  MONGO_COLLECTION_NAME = "webhook_requests";
}

// Mongo connection setup
const WebhookModel = webhookRequest({
  mongoUrl: MONGO_URL,
  collectionSize: +MONGO_COLLECTION_SIZE,
  collectionName: MONGO_COLLECTION_NAME,
});

Hull.logger.transports.console.json = true;

const options = {
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  cache,
};

const app = express();
const connector = new Hull.Connector(options);

if (NODE_ENV === "development") {
  devMode(app, webpackConfig);
}
app.use(middleware(connector.hostSecret));
connector.setupApp(app);
server(app, { hostSecret: options.hostSecret, connector, WebhookModel });
connector.startApp(app);
