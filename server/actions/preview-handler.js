/* @flow */

import connect from "connect";
import timeout from "connect-timeout";
import { Request, Response, Next } from "express";
import type { PreviewRequest } from "../../types";

import compute from "../lib/compute";

async function computeHandler(req: Request, res: Response) {
  const { client, ship } = req.hull;
  // let { ship = {} } = req.body;
  const { payload, code }: PreviewRequest = req.body;
  // This condition ensures boot request does work:
  // When loading the page, the ship is client-side so what's passed to remote
  // doesn't have private_settings embedded
  // ship = ship.private_settings ? ship : req.hull.ship;

  res.type("application/json");

  if (!client || !ship || !payload) {
    return res
      .status(400)
      .json({ reason: "missing_params", message: "Missing Params" });
  }

  const result = await compute({
    payload,
    ship,
    client,
    preview: true,
    code
  });

  try {
    const { logs } = result;
    if (logs && logs.length) {
      logs.map(line => client.logger.debug("preview.console.log", line));
    }
    res.send(result);
    return res.end();
  } catch (error) {
    return res.status(500).json({ error });
  }
}

function haltOnTimedout(req: Request, res: Response, next: Next) {
  if (!req.timedout) next();
}

export default function computeHandlerComponent(options: Object) {
  const app = connect();
  const { connector, hostSecret = "" } = options;

  app.use(timeout("28s"));
  app.use(haltOnTimedout);
  app.use(
    connector.clientMiddleware({
      hostSecret,
      fetchShip: true,
      cacheShip: false
    })
  );
  app.use(haltOnTimedout);
  app.use(computeHandler);
  app.use(haltOnTimedout);

  return function c(req: Request, res: Response) {
    return app.handle(req, res);
  };
}
