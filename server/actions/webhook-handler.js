/* @flow */
import { Request, Response } from "express";
import _ from "lodash";

import processWebhook from "../webhook-processor";

function pickValuesFromRequest(req: Request) {
  const requestParams = _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
  return _.update(requestParams, "headers", value => _.omit(value, ["x-forwarded-for", "x-forwarded-proto", "x-newrelic-id", "x-newrelic-transaction"]));
}

export default function webhookHandler(WebhookModel: Object) {
  return (req: Request, res: Response) => {

    const payload = { webhookData: pickValuesFromRequest(req), date: new Date() };

    const body = payload.webhookData.body;

    if (!Object.keys(body).length) {
      console.log("Invalid body found");
      return res.status(400).send();
    }

    res.send();

    const { client } = req.hull;
    client.logger.debug("connector.request.data", payload.webhookData);
    req.hull.cachedWebhookPayload = payload;

    return processWebhook(payload.webhookData, req.hull, WebhookModel);
  };
}
