/* @flow */
import { Connector } from "hull";

import express from "express";

import webhookHandler from "./actions/webhook-handler";
import computeHandler from "./actions/compute-handler";
import devMode from "./dev-mode";

export default function Server(connector: Connector, options: Object = {}, app: express) {
  const { hostSecret } = options;

  app.get("/admin.html", (req, res) => {
    res.render("admin.html", { hostname: req.hostname, token: req.hull.token, connectorId: req.hull.ship.id });
  });

  app.post("/compute", computeHandler({ hostSecret, connector }));

  app.use("/webhooks", webhookHandler);

  if (options.devMode) app.use(devMode());

  app.use((err, req, res) => { // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: err.status,
        segmentBody: req.segment,
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };
      req.hull.logger.error("Error ----------------", err.message, err.status, data);
    }

    return res.status(err.status || 500).send({ message: err.message });
  });

  return app;
}
