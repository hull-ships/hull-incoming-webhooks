/* @flow */
import express from "express";
import Hull from "hull";
import { Cache } from "hull/lib/infra";
import mongoose from "mongoose";
import _ from "lodash";

import { schema } from "./mongo/db-schema";
import { middleware } from "./lib/crypto";
import server from "./server";

const {
  LOG_LEVEL,
  SECRET,
  NODE_ENV,
  PORT,
  OVERRIDE_FIREHOSE_URL,
  MONGO_URL,
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

const options = {
  hostSecret: SECRET || "1234",
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  cache,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

let app = express();
const connector = new Hull.Connector(options);

app.use(middleware(connector.hostSecret));

const collectionName = "incoming-webhook-requests";
const mongoConnection = mongoose.connect(MONGO_URL || "mongodb://localhost/incoming-webhooks", { useMongoClient: true });

const WebhookModel = _.get(mongoConnection.models, collectionName) || mongoConnection.model(collectionName, schema(MONGO_COLLECTION_SIZE || 524288000));

connector.setupApp(app);

app = server(connector, options, app, WebhookModel);

connector.startApp(app);
