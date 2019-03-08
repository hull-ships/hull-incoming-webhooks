/* @flow */
import { Connector } from "hull";

import express from "express";

import { encrypt } from "./lib/crypto";
import getRecent from "./middlewares/get-recent";
import errorHandler from "./middlewares/error-handler";
import incomingHandler from "./actions/incoming-handler";
import previewHandler from "./actions/preview-handler";
import statusHandler from "./actions/status-handler";
import devMode from "./dev-mode";
import type { ConfResponse } from "../types";

export default function Server(
  connector: Connector,
  options: Object = {},
  app: express,
  EntryModel: Object
) {
  const { hostSecret } = options;

  app.get("/admin.html", (req, res) => {
    res.render("admin.html");
  });

  app.get("/conf", (req, res) => {
    if (
      req.hostname &&
      req.hull.config &&
      req.hull.config.organization &&
      req.hull.config.secret &&
      req.hull.config.ship
    ) {
      const conf: ConfResponse = {
        hostname: req.hostname,
        token: encrypt(req.hull.config, hostSecret)
      };
      res.send(conf);
    }
    res.status(403).send();
  });

  app.get("/recent", getRecent(EntryModel));

  app.post(
    "/webhooks/:connectorId/:token",
    express.urlencoded({ extended: true }),
    express.json(),
    incomingHandler(EntryModel)
  );

  app.post(
    "/webhooks/:connectorId",
    express.urlencoded({ extended: true }),
    express.json(),
    incomingHandler(EntryModel)
  );

  app.post(
    "/compute",
    express.json(),
    previewHandler({ hostSecret, connector })
  );

  app.all("/status", statusHandler);

  if (options.devMode) {
    devMode(app, {
      source: "./src",
      destination: "./dist"
    });
  }

  errorHandler(app);

  return app;
}
