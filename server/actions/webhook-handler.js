/* @flow */
import { Request, Response } from "express";
import _ from "lodash";
import RequestsQueue from "fifo-array";
import updateUser from "../user-update";

function pickValuesFromRequest(req: Request) {
  return _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
}

export default function webhookHandler(req: Request, res: Response) {
  res.send();

  const ttl = 1440000000;
  const payload = { webhookData: pickValuesFromRequest(req), date: new Date().toLocaleString() };
  const { cache, client } = req.hull;
  client.logger.warn("incoming.user", req);

  return cache.get("webhookRequests")
    .then(requests => {
      if (requests) {
        requests.push(payload);
      }
      return requests;
    })
    .then(requests => {
      if (requests) {
        return cache.set("webhookRequests", requests, { ttl });
      }
      return cache.set("webhookRequests", new RequestsQueue(10, [payload]), { ttl })
    })
    .then(() => updateUser(payload.webhookData, req.hull));
}
