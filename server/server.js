/* @flow */
import { Connector } from "hull";

import express from "express";
import bodyParser from "body-parser";

import getLastWebhooks from "./middlewares/get-last-webhooks";
import { encrypt } from "./lib/crypto";
import webhookHandler from "./actions/webhook-handler";
import computeHandler from "./actions/compute-handler";
import devMode from "./dev-mode";
import errorHandler from "./middlewares/error-handler";
import statusCheck from "./actions/status-check";

export default function Server(connector: Connector, options: Object = {}, app: express) {
  const { hostSecret, WebhookModel } = options;

  app.use((req, res, next) => {
    if (req.hull) {
      req.hull.service = req.hull.service || {};
      req.hull.service.WebhookModel = WebhookModel;
    }
    next();
  });

  app.get("/admin.html", (req, res) => {
    res.render("admin.html");
  });

  app.get("/conf", (req, res) => {
    if (req.hostname && req.hull.config && req.hull.config.organization && req.hull.config.secret && req.hull.config.ship) {
      res.send({ hostname: req.hostname, token: encrypt(req.hull.config, hostSecret) });
    }
    res.status(403).send();
  });

  app.get("/last-webhooks", getLastWebhooks);

  app.post("/webhooks/:connectorId", bodyParser.urlencoded(), webhookHandler);
  app.post("/webhooks/:connectorId/:token", bodyParser.urlencoded(), webhookHandler);

  app.post("/compute", computeHandler({ hostSecret, connector }));

  app.all("/status", statusCheck);

  if (options.devMode) {
    app.use(devMode());
  }

  errorHandler(app);

  return app;
}
