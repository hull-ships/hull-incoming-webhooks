/* @flow */
import { Request, Response } from "express";
import updateUser from "../user-update";
import _ from "lodash";

function pickValuesFromRequest(req: Request) {
  return _.pick(req, ["body", "headers", "cookies", "ip", "method", "params", "query"]);
}

export default function webhookHandler(req: Request, res: Response) {
  res.send();
  return req.hull.cache.set("webhookRequest", pickValuesFromRequest(req), { ttl: 1440000000 }).then((cachedValue) => {
    updateUser(cachedValue, req.hull);
  });
}
