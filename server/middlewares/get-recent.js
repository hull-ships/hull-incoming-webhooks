/* @flow */
import { Request, Response } from "express";
import moment from "moment";
import _ from "lodash";
import type { Entry } from "../../types";

export default function getRecent(Model: Object) {
  return (req: Request, res: Response) => {
    const { client, ship = {} } = req.hull;
    const query = Model.find({ connectorId: ship.id })
      .sort({ date: -1 })
      .limit(100);

    query.lean().exec((err, docs) => {
      if (err) {
        client.logger.debug("mongo.query.error", { errors: err });
        res.status(500).json({ recent: [] });
      }

      const recent: Array<Entry> =
        _.map(docs, item =>
          _.set(
            _.omit(item, ["_id", "__v", "connectorId"]),
            "date",
            moment(item.date).format("MMM Do YYYY, h:mm:ss A")
          )
        ) || [];

      return res.status(200).json(recent);
    });
  };
}
