import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import deepFreeze from "deep-freeze";
import request from "request";
import Promise from "bluebird";

const TOP_LEVEL_FIELDS = ["tags", "name", "description", "extra", "picture", "settings", "username", "email", "contact_email", "image", "first_name", "last_name", "address", "created_at", "phone", "domain", "accepts_marketing"];

function applyUtils(sandbox = {}) {
  const lodash = _.functions(_).reduce((l, key) => {
    l[key] = (...args) => _[key](...args);
    return l;
  }, {});

  sandbox.moment = deepFreeze((...args) => { return moment(...args); });
  sandbox.urijs = deepFreeze((...args) => { return urijs(...args); });
  sandbox._ = deepFreeze(lodash);
}

const buildPayload = (pld, traitsCall = {}) => {
  const { properties, context = {} } = traitsCall;
  if (properties) {
    const { source } = context;
    if (source) {
      pld[source] = { ...pld[source], ...properties };
    } else {
      _.map(properties, (v, k) => {
        const path = k.replace("/", ".");
        if (path.indexOf(".") > -1) {
          _.setWith(pld, path, v, Object);
        } else if (_.includes(TOP_LEVEL_FIELDS, k)) {
          pld[k] = v;
        } else {
          pld.traits = {
            ...pld.traits,
            [k]: v
          };
        }
      });
    }
  }
  return pld;
};

const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}

module.exports = function compute(webhookRequest, ship = {}, client = {}, options = {}) {
  const { preview } = options;
  const { private_settings = {} } = ship;
  const code = _.get(options, "code", _.get(private_settings, "code", ""));

  const sandbox = getSandbox(ship);

  sandbox.req = webhookRequest;

  sandbox.ship = ship;
  sandbox.payload = {};

  applyUtils(sandbox);

  let userIdentity = {};
  let tracks = [];
  const userTraits = [];
  const accountTraits = [];
  let accountIdentity = {};
  const logs = [];
  const errors = [];
  let isAsync = false;

  sandbox.results = [];
  sandbox.errors = errors;
  sandbox.logs = logs;

  const track = (eventName, properties = {}, context = {}) => {
    if (eventName) tracks.push({ eventName, properties, context });
  };

  const traits = (properties = {}, context = {}) => {
    userTraits.push({ properties, context });
  };

  const asUser = (userIdent = {}) => {
    try {
      client.asUser(userIdent);
    } catch (err) {
      errors.push(`Encountered error while calling asUser : ${_.get(err, "message", "")}`);
    }
    userIdentity = userIdent;
  };

  sandbox.track = track;
  sandbox.traits = traits;
  sandbox.asUser = asUser;

  sandbox.hull = {
    account: (identity = null) => {
      if (identity) {
        accountIdentity = identity;
      }
      return {
        traits: (properties = {}, context = {}) => {
          accountTraits.push({ properties, context });
        }
      };
    },
    traits,
    track,
    asUser
  };

  sandbox.request = (opts, callback) => {
    isAsync = true;
    return request.defaults({ timeout: 3000 })(opts, (error, response, body) => {
      try {
        callback(error, response, body);
      } catch (err) {
        errors.push(err.toString());
      }
    });
  };

  function log(...args) {
    logs.push(args);
  }

  function debug(...args) {
    // Only show debug logs in preview mode
    if (options.preview) {
      logs.push(args);
    }
  }

  function logError(...args) {
    errors.push(args);
  }
  sandbox.console = { log, warn: log, error: logError, debug };

  try {
    const script = new vm.Script(`
      try {
        results.push(function() {
          "use strict";
          ${code}
        }());
      } catch (err) {
        errors.push(err.toString());
      }`);
    script.runInContext(sandbox);
  } catch (err) {
    errors.push(err.toString());
  }

  if (isAsync && !_.some(_.compact(sandbox.results), (r) => _.isFunction(r.then))) {
    errors.push("It seems you’re using 'request' which is asynchronous.");
    errors.push("You need to return a 'new Promise' and 'resolve' or 'reject' it in you 'request' callback.");
  }

  if (_.isEmpty(userIdentity)) {
    errors.push("You have to call 'asUser' method with user's identity. Every next invocation will override previous one.");
  }

  return Promise.all(sandbox.results)
  .catch((err) => {
    errors.push(err.toString());
  })
  .then(() => {
    if (preview && tracks.length > 10) {
      logs.unshift([tracks]);
      logs.unshift([`You're trying to send ${tracks.length} calls at a time. We will only process the first 10`]);
      logs.unshift(["You can't send more than 10 tracking calls in one batch."]);
      tracks = _.slice(tracks, 0, 10);
    }

    return {
      userIdentity,
      logs,
      errors,
      userTraits: _.reduce(userTraits, buildPayload, {}),
      events: tracks,
      payload: sandbox.payload,
      accountIdentity,
      accountTraits: _.reduce(accountTraits, buildPayload, {})
    };
  });
};
