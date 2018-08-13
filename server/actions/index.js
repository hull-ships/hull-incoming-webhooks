// @flow
import type { $Response } from "express";
import type { TRequestIncomingWebhooks } from "../types";

const check = require("syntax-error");
const _ = require("lodash");

const processWebhook = require("../webhook-processor");

function pickValuesFromRequest(req: TRequestIncomingWebhooks) {
  const requestParams = _.pick(req, [
    "body",
    "headers",
    "cookies",
    "ip",
    "method",
    "params",
    "query",
  ]);
  return _.update(requestParams, "headers", value =>
    _.omit(value, [
      "x-forwarded-for",
      "x-forwarded-proto",
      "x-newrelic-id",
      "x-newrelic-transaction",
    ])
  );
}

module.exports.webhookHandler = function webhookHandler(
  WebhookModel: Function
) {
  return (req: TRequestIncomingWebhooks, res: $Response) => {
    res.send();

    const payload = {
      webhookData: pickValuesFromRequest(req),
      date: new Date(),
    };
    const { client } = req.hull;
    client.logger.debug("connector.request.data", payload.webhookData);

    req.hull.cachedWebhookPayload = payload;

    return processWebhook(payload.webhookData, req.hull, WebhookModel);
  };
};

module.exports.statusCheck = (
  req: TRequestIncomingWebhooks,
  res: $Response
) => {
  const { ship, client } = req.hull;
  const messages = [];
  let status = "ok";
  if (!_.get(ship.private_settings, "code")) {
    status = "error";
    messages.push("Settings are empty");
  }

  const err = check(ship.private_settings.code);
  if (err) {
    status = "error";
    messages.push("Settings are referencing invalid values");
  }

  res.json({ messages, status });
  return client.put(`${ship.id}/status`, { status, messages });
};
