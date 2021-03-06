/* @flow */
import { Connector } from "hull";

import express from "express";

import getLastWebhooks from "./middlewares/get-last-webhooks";
import removeOldWebhooks from "./middlewares/remove-old-webhooks";
import { encrypt } from "./lib/crypto";
import webhookHandler from "./actions/webhook-handler";
import computeHandler from "./actions/compute-handler";
import devMode from "./dev-mode";
import errorHandler from "./middlewares/error-handler";
import statusCheck from "./actions/status-check";

export default function Server(connector: Connector, options: Object = {}, app: express, WebhookModel: Object) {
  const { hostSecret } = options;

  app.get("/admin.html", (req, res) => {
    res.render("admin.html");
  });

  app.get("/conf", (req, res) => {
    if (req.hostname && req.hull.config && req.hull.config.organization && req.hull.config.secret && req.hull.config.ship) {
      res.send({ hostname: req.hostname, token: encrypt(req.hull.config, hostSecret) });
    }
    res.status(403).send();
  });

  app.get("/last-webhooks", getLastWebhooks(WebhookModel));
  app.all("/remove-old-webhooks", removeOldWebhooks(WebhookModel));

  app.post("/webhooks/:connectorId/:token", express.urlencoded({ extended: true }), express.json(), webhookHandler(WebhookModel));

  app.post("/webhooks/:connectorId", express.urlencoded({ extended: true }), express.json(), webhookHandler(WebhookModel));

  app.post("/compute", computeHandler({ hostSecret, connector }));

  app.all("/status", statusCheck);

  if (options.devMode) {
    app.use(devMode());
  }

  errorHandler(app);

  return app;
}
