// @flow

import type { $Application, $Response } from "express";
import type { TRequest } from "hull";

const express = require("express");
const { smartNotifierHandler } = require("hull/lib/utils");
const bodyParser = require("body-parser");

const notificationsConfiguration = require("./notifications-configuration");
const { webhookHandler, statusCheck } = require("./actions");

const getLastWebhooks = require("./middlewares/get-last-webhooks");
const { encrypt } = require("./lib/crypto");
const computeHandler = require("./actions/compute-handler");

function server(
  app: $Application,
  { token, connector, hostSecret, WebhookModel }: Object
): $Application {
  app.get("/admin.html", (req: TRequest, res: $Response) => {
    res.render("admin.html", { hostname: req.hostname, token });
  });

  app.all("/webhook", bodyParser.json(), webhookHandler);

  app.all("/status", statusCheck);

  app.use(
    "/batch",
    smartNotifierHandler({
      userHandlerOptions: {
        groupTraits: false,
      },
      handlers: notificationsConfiguration,
    })
  );

  app.use(
    "/smart-notifier",
    smartNotifierHandler({
      handlers: notificationsConfiguration,
    })
  );

  app.get("/conf", (req: TRequest, res: $Response) => {
    if (
      req.hostname &&
      req.hull.config &&
      req.hull.config.organization &&
      req.hull.config.secret &&
      req.hull.config.ship
    ) {
      res.send({
        hostname: req.hostname,
        token: encrypt(req.hull.config, hostSecret),
      });
    }
    res.status(403).send();
  });

  app.get("/last-webhooks", getLastWebhooks(WebhookModel));

  app.post(
    "/webhooks/:connectorId/:token",
    express.urlencoded({ extended: true }),
    express.json(),
    webhookHandler(WebhookModel)
  );

  app.post(
    "/webhooks/:connectorId",
    express.urlencoded({ extended: true }),
    express.json(),
    webhookHandler(WebhookModel)
  );

  app.post("/compute", computeHandler({ hostSecret, connector }));

  return app;
}

module.exports = server;
