// @flow

import vm from "vm";
import request from "request";
import _ from "lodash";
import type { HullConnector, Result } from "hull";
import type { RunOptions } from "../../types";
import buildHullContext from "./hull-context";
import getFrozenLibs from "./frozen-libs";

const sandboxes = {};

function buildSandbox(ship: HullConnector, context: {}) {
  const s = sandboxes[ship.id];
  // find or create sandobx and memoize;
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return {
    ...sandboxes[ship.id],
    ...context,
    ship,
    payload: {},
    responses: [],
    ...getFrozenLibs()
  };
}

function buildRequest(result: Result): any => any {
  return (opts, callback) => {
    result.isAsync = true;
    return request.defaults({ timeout: 3000 })(
      opts,
      (error, response, body) => {
        try {
          if (callback) {
            callback(error, response, body);
          } else {
            throw new Error("Method has no callback defined");
          }
        } catch (err) {
          result.errors.push(err.toString());
        }
      }
    );
  };
}

function buildConsole(
  { errors, logs, logsForLogger }: Result,
  preview: boolean
) {
  function log(...args) {
    logs.push(args);
  }
  function debug(...args) {
    // Only show debug logs in preview mode
    if (preview) {
      logs.push(args);
    }
  }
  function logError(...args) {
    errors.push(args);
  }
  function info(...args) {
    logs.push(args);
    logsForLogger.push(args);
  }
  return {
    log,
    warn: log,
    error: logError,
    debug,
    info
  };
}

export default async function runScript({
  ship,
  client,
  context,
  code,
  preview
}: RunOptions): Promise<Result> {
  const result = {
    logs: [],
    logsForLogger: [],
    errors: [],
    userTraits: [],
    accountTraits: [],
    events: [],
    accountLinks: [],
    success: false,
    isAsync: false
  };

  const sandbox = buildSandbox(ship, {
    ...context,
    request: buildRequest(result),
    hull: buildHullContext(client, result),
    console: buildConsole(result, preview),
    responses: []
  });

  try {
    const script = new vm.Script(`
      try {
        responses.push(function() {
          "use strict";
          ${code}
        }());
      } catch (err) {
        errors.push(err.toString());
      }`);
    script.runInContext(sandbox);
  } catch (err) {
    result.errors.push(err.toString());
  }
  const { responses } = sandbox;
  if (
    responses.length &&
    result.isAsync &&
    !_.some(_.compact(responses), r => _.isFunction(r.then))
  ) {
    result.errors.push(
      "It seems you’re using 'request' which is asynchronous."
    );
    result.errors.push(
      "You need to return a 'new Promise' and 'resolve' or 'reject' it in you 'request' callback."
    );
  }

  try {
    await Promise.all(responses);
    if (preview && result.events.length > 10) {
      result.logs.unshift(result.events);
      result.logs.unshift(
        `You're trying to send ${
          result.events.length
        } 'track' calls at a time. We will only process the first 10`
      );
      result.logs.unshift(
        "You can't send more than 10 tracking calls in one batch."
      );
      result.events = _.slice(result.events, 0, 10);
    }
  } catch (err) {
    result.errors.push(err.toString());
  }
  return result;
}