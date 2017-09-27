/* @flow */
import { Request, Response } from "express";
import _ from "lodash";

import updateUser from "../webhook-processor";

function pickValuesFromRequest(req: Request) {
  const requestParams = _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
  return _.update(requestParams, "headers", value => _.omit(value, ["x-forwarded-for", "x-forwarded-proto", "x-newrelic-id", "x-newrelic-transaction"]));
}

export default function webhookHandler(WebhookModel: Object) {
  return (req: Request, res: Response) => {
    res.send();

    const payload = { webhookData: pickValuesFromRequest(req), date: new Date() };
    const { client } = req.hull;
    client.logger.debug("incoming.user", payload.webhookData);

    req.hull.cachedWebhookPayload = payload;

    return updateUser(payload.webhookData, req.hull, WebhookModel);
  };
}
