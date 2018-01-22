/* @flow */
import express from "express";
import compression from "compression";
import Hull from "hull";
import { Cache } from "hull/lib/infra";

import { middleware } from "./lib/crypto";
import server from "./server";
import webhookRequest from "./models/webhook-request";
import dotenv from "dotenv";

dotenv.config();

const {
  LOG_LEVEL,
  SECRET,
  NODE_ENV,
  PORT,
  MONGO_URL,
  MONGO_COLLECTION_NAME,
  MONGO_COLLECTION_SIZE
} = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

const cache = new Cache({
  store: "memory",
  ttl: 1
});

// Mongo connection setup
const WebhookModel = webhookRequest({
  mongoUrl: MONGO_URL,
  collectionSize: MONGO_COLLECTION_SIZE || 524288000,
  collectionName: MONGO_COLLECTION_NAME || "webhook_requests"
});


const options = {
  hostSecret: SECRET || "1234",
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  cache
};

let app = express();
app.use(compression());
const connector = new Hull.Connector(options);

app.use(middleware(connector.hostSecret));

connector.setupApp(app);

app = server(connector, options, app, WebhookModel);

connector.startApp(app);
