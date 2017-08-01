/* @flow */
import express from "express";

export default function (app: express) {
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: err.status,
        segmentBody: req.segment,
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };
      console.error("Error ----------------", err.message, err.status, data);
      console.warn(err.stack);
      return res.status(err.status || 500).send({ message: err.message });
    }
    console.warn("Unknown error ?");
    return res.status(500).send({ message: "Unknown error" });
  });
}
