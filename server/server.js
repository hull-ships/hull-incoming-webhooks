/* @flow */
import { Connector } from "hull";

import express from "express";
import bodyParser from "body-parser";

import { encrypt } from "./lib/crypto";
import webhookHandler from "./actions/webhook-handler";
import computeHandler from "./actions/compute-handler";
import devMode from "./dev-mode";
import errorHandler from "./middlewares/error-handler";
import statusCheck from "./actions/status-check";
import mongoCollectionMiddleware from "./middlewares/mongo-collection-middleware";

export default function Server(connector: Connector, options: Object = {}, app: express) {
  const { hostSecret, mongoDbConnectionUrl, dbName } = options;

  app.get("/admin.html", (req, res) => {
    const token = encrypt(req.hull.config, hostSecret);
    res.render("admin.html", { hostname: req.hostname, token, connectorId: req.hull.ship.id });
  });

  const mongoMiddleware = mongoCollectionMiddleware(mongoDbConnectionUrl, dbName);

  app.post("/webhooks/:connectorId", mongoMiddleware, bodyParser.urlencoded(), webhookHandler);

  app.post("/compute", mongoMiddleware, computeHandler({ hostSecret, connector }));

  app.all("/status", statusCheck);

  if (options.devMode) {
    app.use(devMode());
  }

  errorHandler(app);

  return app;
}
