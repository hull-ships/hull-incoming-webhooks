// @flow
import type { $Response, NextFunction } from "express";
import type { TRequestIncomingWebhooks } from "../types";

const crypto = require("crypto");
const qs = require("querystring");
const url = require("url");
const _ = require("lodash");

const algorithm = "aes-128-cbc";

const encrypt = (text: string, password: string) => {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(qs.stringify(text), "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
};

const decrypt = (text: string, password: string) => {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(text), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
};

const middleware = (password: string) => {
  return (
    req: TRequestIncomingWebhooks,
    res: $Response,
    next: NextFunction
  ) => {
    const pathName = _.get(
      url.parse(req.url).pathname.match("/webhooks/(?:[a-zA-Z0-9]*)/(.*)"),
      "[1]"
    );
    if (pathName) {
      req.hull = req.hull || {};
      req.hull.config = decrypt(pathName, password);
      return next();
    }

    if (req.query && req.query.conf) {
      req.hull = req.hull || {};
      req.hull.config = decrypt(req.query.conf, password);
      return next();
    }
    return next();
  };
};

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.middleware = middleware;
