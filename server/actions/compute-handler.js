/* @flow */

import connect from "connect";
import timeout from "connect-timeout";
import bodyParser from "body-parser";
import { Request, Response, Next } from "express";

import compute from "../compute";
import {
  withValidUserClaims,
  withValidAccountClaims,
  withValidUserOrAccountClaims
} from "../lib/map-filter-results";

async function computeHandler(req: Request, res: Response) {
  const { client } = req.hull;
  let { ship = {} } = req.body;
  const { webhook, code } = req.body;
  // This condition ensures boot request does work:
  // When loading the page, the ship is client-side so what's passed to remote
  // doesn't have private_settings embedded
  ship = ship.private_settings ? ship : req.hull.ship;

  res.type("application/json");

  if (client && ship && webhook) {
    const computed = await compute(webhook, ship, client, {
      code,
      preview: true
    });
    const { logs, userTraits, accountTraits, accountLinks, events } = computed;
    try {
      if (logs && logs.length) {
        logs.map(line => client.logger.debug("preview.console.log", line));
      }

      const result = {
        events: withValidUserClaims(client)(events),
        accountLinks: withValidUserOrAccountClaims(client)(accountLinks),
        userTraits: withValidUserClaims(client)(userTraits),
        accountTraits: withValidAccountClaims(client)(accountTraits)
      };

      return res.send({ ship, result }).end();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  } else {
    return res
      .status(400)
      .json({ reason: "missing_params", message: "Missing Params" });
  }
}

function haltOnTimedout(req: Request, res: Response, next: Next) {
  if (!req.timedout) next();
}

export default function computeHandlerComponent(options: Object) {
  const app = connect();
  const { connector, hostSecret = "" } = options;

  app.use(timeout("28s"));
  app.use(bodyParser.json());
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
