/* @flow */
import { Request, Response } from "express";
import _ from "lodash";
import RequestsQueue from "fifo-array";
import updateUser from "../webhook-processor";

function pickValuesFromRequest(req: Request) {
  const requestParams = _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
  return _.update(_.update(requestParams, "headers", value => _.omit(value, [
    "x-forwarded-for", "x-forwarded-proto", "x-newrelic-id", "x-newrelic-transaction"
  ])), "query", value => _.omit(value, ["token", "conf"]));
}

export default function webhookHandler(req: Request, res: Response) {
  res.send();

  const ttl = 1440000000;
  const payload = { webhookData: pickValuesFromRequest(req), date: new Date().toLocaleString() };
  const { cache, client, ship } = req.hull;
  const key = `${_.get(ship, "id")}-webhook-requests`;
  client.logger.debug("incoming.user", payload.webhookData);

  return cache.get(key)
    .then(requests => {
      if (requests) {
        requests.push(payload);
      }
      return requests;
    })
    .then(requests => {
      if (requests) {
        return cache.set(key, requests, { ttl });
      }
      return cache.set(key, new RequestsQueue(100, [payload]), { ttl });
    })
    .then(() => updateUser(payload.webhookData, req.hull));
}
