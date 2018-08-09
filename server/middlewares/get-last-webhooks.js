// @flow
import type { $Response } from "express";
import type { THullRequest } from "hull";

const moment = require("moment");
const _ = require("lodash");

module.exports = function getLastWebhooks(WebhookModel: Object) {
  return (req: THullRequest, res: $Response) => {
    const { client, ship = {} } = req.hull;

    const query = WebhookModel.find({ connectorId: ship.id })
      .sort({ date: -1 })
      .limit(100);

    query.lean().exec((err, docs) => {
      if (err) {
        client.logger.debug("mongo.query.error", { errors: err });
        res.status(500).json({ lastWebhooks: [] });
      }

      const lastWebhooks =
        _.map(docs, webhook =>
          _.set(
            _.omit(webhook, ["_id", "__v", "connectorId"]),
            "date",
            moment(webhook.date).format("MMM Do YYYY, h:mm:ss A")
          )
        ) || [];

      return res.status(200).json({ lastWebhooks });
    });
  };
};
