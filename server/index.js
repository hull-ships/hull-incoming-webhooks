// @flow

const Hull = require("hull");
const express = require("express");
const { devMode } = require("hull/lib/utils");
const webpackConfig = require("../webpack.config");
const { Cache } = require("hull/lib/infra");
const dotenv = require("dotenv");
const webhookRequest = require("./models/webhook-request");

dotenv.config();

const server = require("./server");

const {
  LOG_LEVEL,
  SECRET,
  PORT,
  NODE_ENV,
  MONGO_URL,
  MONGO_COLLECTION_NAME,
  MONGO_COLLECTION_SIZE,
} = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

const cache = new Cache({
  store: "memory",
  ttl: 1,
});

// Mongo connection setup
const WebhookModel = webhookRequest({
  mongoUrl: MONGO_URL,
  collectionSize: MONGO_COLLECTION_SIZE || 524288000,
  collectionName: MONGO_COLLECTION_NAME || "webhook_requests",
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

connector.setupApp(app);
server(app, { hostSecret: options.hostSecret, connector, WebhookModel });
connector.startApp(app);
