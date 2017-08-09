/* @flow */
import { Request, Response, Next } from "express";

export default function getLastWebhooks(req: Request, res: Response, next: Next) {
  req.hull.cache.get("webhookRequests").then(requests => {
    req.hull.lastWebhooks = requests || [];
    return requests;
  }).then(() => next());
}
