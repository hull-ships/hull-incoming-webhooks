/* @flow */
import express from "express";
import Hull from "hull";
import { Cache } from "hull/lib/infra";
import { middleware } from "./lib/crypto";
import server from "./server";

const {
  LOG_LEVEL,
  SECRET = "1234",
  NODE_ENV,
  PORT = 8082,
  OVERRIDE_FIREHOSE_URL,
  MONGO_URL,
  DB_NAME
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
  hostSecret: SECRET,
  devMode: NODE_ENV === "development",
  port: PORT,
  cache,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  mongoDbConnectionUrl: MONGO_URL || "mongodb://localhost",
  dbName: DB_NAME || "incoming-webhooks"
};

let app = express();
const connector = new Hull.Connector(options);

app.use(middleware(connector.hostSecret));

connector.setupApp(app);

app = server(connector, options, app);

connector.startApp(app);
