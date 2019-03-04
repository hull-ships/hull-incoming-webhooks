/* @flow */

import type { $Request, $Response } from "express";
import _ from "lodash";

import compute from "../lib/compute";
import ingest from "../lib/ingest";
import type { Payload } from "../../types";

const pickValuesFromRequest = ({
  body,
  headers,
  cookies,
  ip,
  method,
  params,
  query
}: $Request) => ({
  body,
  cookies,
  ip,
  method,
  params,
  query,
  headers: _.omit(headers, [
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-newrelic-id",
    "x-newrelic-transaction"
  ])
});

export default function handler(Model: Object) {
  return async (req: $Request, res: $Response) => {
    const { client, ship, metric } = req.hull;
    const { private_settings = {} } = ship;
    const { code } = private_settings;

    // Stop if we aren't initialized properly, notifying sender that we couldn't find the proper credentials
    if (!client || !ship) {
      res.status(404).json({
        reason: "connector_not_found",
        message: "We couldn't find a connector for this token"
      });
      return;
    }

    res.send(200);

    const payload: Payload = pickValuesFromRequest(req);
    client.logger.debug("connector.request.data", payload);
    req.hull.cachedPayload = payload;

    const result = await compute({
      payload,
      ship,
      client,
      code,
      preview: false
    });

    try {
      ingest(
        {
          payload,
          code,
          result,
          ship,
          client,
          metric
        },
        Model
      );
    } catch (err) {
      client.logger.error("incoming.user.error", {
        hull_summary: `Error Processing user: ${_.get(
          err,
          "message",
          "Unexpected error"
        )}`,
        err
      });
    }
  };
}
