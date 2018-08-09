// @flow
import type { $Application, $Request, $Response, NextFunction } from "express";
const Hull = require("hull");
const _ = require("lodash");

module.exports = function(app: $Application) {
  app.use((err: Error, req: $Request, res: $Response, next: NextFunction ) => {
    // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: _.get(err, "status"),
        segmentBody: _.get(req, "segment"),
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params,
      };
      const logger = _.get(req, "hull.client.logger", _.get(Hull, "logger"));
      if (logger) {
        logger.error("request.error", err.message, data); // , err.status
      }
      if (!res.headersSent) {
        return res
          .status(_.get(err, "status") || 500)
          .send({ message: _.get(err, "message") });
      }
    }
    if (!res.headersSent) {
      return res.status(500).send({ message: "Unknown error" });
    }
    return Hull.logger.error("request.error", { message: "Unknown error" });
  });
};
