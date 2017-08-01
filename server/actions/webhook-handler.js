/* @flow */
import { Request, Response } from "express";
import updateUser from "../user-update";
import _ from "lodash";

function pickValuesFromRequest(req: Request) {
  return _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
}

export default function webhookHandler(req: Request, res: Response) {
  res.send();
  const ttl = 1440000000;
  const payload = pickValuesFromRequest(req);
  req.hull.logger.debug("incoming.webhook", req);
  return req.hull.cache
    .set("webhookRequest", payload, { ttl })
    .then(cachedValue => updateUser(cachedValue, req.hull));
}
