const Hull = require("hull");
const express = require("express");

const { Cache } = require("hull/lib/infra");

const { middleware } = require("../../../server/lib/crypto");
const webhookRequest = require("../../../server/models/webhook-request");
const server = require("../../../server/server");

const WebhookModel = webhookRequest({
  mongoUrl: "mongodb://localhost:27017/incoming-webhooks-tests",
  collectionSize: 524288000,
  collectionName: "webhook_requests",
});

module.exports = function bootstrap() {
  const cache = new Cache({
    store: "memory",
    ttl: 1
  });

  const options = {
    hostSecret: "1234",
    port: 8000,
    cache,
    clientConfig: { protocol: "http", firehoseUrl: "firehose" },
    mongoDbConnectionUrl: "mongodb://localhost",
    dbName: "incoming-webhooks-tests"
  };

  const app = express();
  const connector = new Hull.Connector(options);
  app.use(middleware(connector.hostSecret));
  connector.setupApp(app);
  server(app, { hostSecret: options.hostSecret, connector, WebhookModel });
  return connector.startApp(app);
}
