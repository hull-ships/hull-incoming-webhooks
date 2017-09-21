/* @flow */
import express from "express";
import Hull from "hull";
import { Cache } from "hull/lib/infra";
import { middleware } from "./lib/crypto";
import server from "./server";

const {
  LOG_LEVEL,
  SECRET,
  NODE_ENV,
  PORT,
  OVERRIDE_FIREHOSE_URL,
  MONGO_URL,
  DB_NAME,
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
  },
  mongoDbConnectionUrl: MONGO_URL || "mongodb://localhost",
  mongoCappedCollectionSize: MONGO_COLLECTION_SIZE || 524288000
};

let app = express();
const connector = new Hull.Connector(options);

app.use(middleware(connector.hostSecret));

connector.setupApp(app);

app = server(connector, options, app);

connector.startApp(app);
