// @flow
import type { $Response, NextFunction } from "express";
import type { TRequestIncomingWebhooks } from "../types";

const connect = require("connect");
const timeout = require("connect-timeout");
const bodyParser = require("body-parser");
const _ = require("lodash");

const compute = require("../compute");
const {
  filterInvalidIdentities,
  reducePayload,
} = require("../lib/map-filter-results");

function computeHandler(req: TRequestIncomingWebhooks, res: $Response) {
  const { client } = req.hull;
  let { ship = {} } = req.body;
  const { webhook, code } = req.body;
  // This condition ensures boot request does work:
  // When loading the page, the ship is client-side so what's passed to remote
  // doesn't have private_settings embedded
  ship = ship.private_settings ? ship : req.hull.ship;

  res.type("application/json");

  if (client && ship && webhook) {
    compute(webhook, ship, client, { code, preview: true })
      .then(result => {
        const logs = result.logs;
        if (logs && logs.length) {
          logs.map(line =>
            req.hull.client.logger.debug("preview.console.log", line)
          );
        }
        result.userTraits = reducePayload(
          filterInvalidIdentities(
            result.userTraits.map(u => _.omit(u, ["userIdentityOptions"])),
            client,
            "user"
          ),
          "userTraits"
        );
        result.events = filterInvalidIdentities(result.events, client, "event");
        result.accountTraits = reducePayload(
          filterInvalidIdentities(
            result.accountTraits.map(a =>
              _.omit(a, ["accountIdentityOptions"])
            ),
            client,
            "account"
          ),
          "accountTraits"
        );
        result.accountLinks = reducePayload(
          filterInvalidIdentities(
            result.accountLinks.map(a =>
              _.omit(a, ["userIdentityOptions", "accountIdentityOptions"])
            ),
            client,
            "account.link"
          ),
          "accountIdentity"
        );
        res.send({ ship, result }).end();
      })
      .catch(error => {
        return res.status(500).json({ error });
      });
  } else {
    res
      .status(400)
      .json({ reason: "missing_params", message: "Missing Params" });
  }
}

function haltOnTimedout(
  req: TRequestIncomingWebhooks,
  res: $Response,
  next: NextFunction
) {
  if (!req.timedout) next();
}

module.exports = (options: Object) => {
  const app = connect();
  const { connector, hostSecret = "" } = options;

  app.use(timeout("28s"));
  app.use(bodyParser.json());
  app.use(haltOnTimedout);
  app.use(
    connector.clientMiddleware({
      hostSecret,
      fetchShip: true,
      cacheShip: false,
    })
  );
  app.use(haltOnTimedout);
  app.use(computeHandler);
  app.use(haltOnTimedout);

  return function c(req: TRequestIncomingWebhooks, res: $Response) {
    return app.handle(req, res);
  };
};
