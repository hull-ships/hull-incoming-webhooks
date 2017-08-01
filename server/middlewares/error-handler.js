/* @flow */
import express from "express";
import Hull from "hull";
import _ from "lodash";

export default function (app: express) {
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: _.get(err, "status"),
        segmentBody: _.get(req, "segment"),
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };


      const logger = _.get(req, "hull.client.logger");
      if (logger) {
        logger.error("request.error", err.message, err.status, data);
      } else {
        Hull.logger.error("request.error", err.message, err.status, data);
      }
      return res.status(_.get(err, "status") || 500).send({ message: _.get(err, "message") });
    }
    
    Hull.logger.warn("Unknown error ?");
    return res.status(500).send({ message: "Unknown error" });
  });
}
