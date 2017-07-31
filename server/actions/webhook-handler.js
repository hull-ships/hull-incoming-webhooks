/* @flow */
import { Request, Response } from "express";
import updateUser from "../user-update";

export default function webhookHandler(req: Request, res: Response) {
  // TODO VERIFY TOKEN
  res.send();
  return req.hull.cache.set("webhookRequest", req.body, { ttl: 1440000000 }).then(() => updateUser(req.body, req.headers, req.hull));
}
