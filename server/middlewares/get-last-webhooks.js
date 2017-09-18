/* @flow */
import { Request, Response, Next } from "express";
import _ from "lodash";

export default function getLastWebhooks(req: Request, res: Response, next: Next) {
  const { cache, ship } = req.hull;
  const key = `${_.get(ship, "id")}-webhook-requests`;
  cache.get(key).then(requests => {
    req.hull.lastWebhooks = requests || [];
    return requests;
  }).then(() => next());
}
