import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import deepFreeze from "deep-freeze";
import request from "request";
import Promise from "bluebird";

const lodash = _.functions(_).reduce((l, key) => {
  l[key] = (...args) => _[key](...args);
  return l;
}, {});

const frozenMoment = deepFreeze((...args) => {
  return moment(...args);
});
const frozenUrijs = deepFreeze((...args) => {
  return urijs(...args);
});
const frozenLodash = deepFreeze(lodash);

function applyUtils(sandbox = {}) {
  sandbox.moment = frozenMoment;
  sandbox.urijs = frozenUrijs;
  sandbox._ = frozenLodash;
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
        } else {
          pld[k] = v;
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

  Object.keys(webhookRequest).forEach(userKey => {
    sandbox[userKey] = webhookRequest[userKey];
  });

  sandbox.ship = ship;
  sandbox.payload = {};

  applyUtils(sandbox);

  let tracks = [];
  const userTraitsList = [];
  const accountTraitsList = [];
  const accountLinksList = [];
  const logs = [];
  const logsForLogger = [];
  const errors = [];
  let isAsync = false;

  sandbox.results = [];
  sandbox.errors = errors;
  sandbox.logs = logs;

  const track = (userIdentity, userIdentityOptions) =>
    (eventName, properties = {}, context = {}) =>
      eventName && tracks.push({ userIdentity, userIdentityOptions, event: { eventName, properties, context } });

  const identify =  (userIdentity, userIdentityOptions) =>
    (properties = {}, context = {}) =>
      userTraitsList.push({ userIdentity, userIdentityOptions, userTraits: [{ properties, context }] });

  const accountIdentify = (accountIdentity, accountIdentityOptions) =>
    (properties = {}, context = {}) =>
      accountTraitsList.push({ accountIdentity, accountIdentityOptions, accountTraits: [{ properties, context }] });

  const account = (accountIdentity = null, accountIdentityOptions = {}) => {
    if (accountIdentity) {
      const identify = accountIdentify(accountIdentity, accountIdentityOptions)
      return { identify; traits: identify };
    }
    return errors.push("Account identity cannot be empty");
  }

  const links = (userIdentity, userIdentityOptions) => (accountIdentity = {}, accountIdentityOptions = {}) => {
    accountLinksList.push({ userIdentity, userIdentityOptions, accountIdentity, accountIdentityOptions });
    return account(accountIdentity, accountIdentityOptions);
  };

  const user = (userIdentity = {}, userIdentityOptions = {}) => {
    try {
      client.asUser(userIdentity);
    } catch (err) {
      errors.push(`Encountered error while calling asUser : ${_.get(err, "message", "")}`);
    }
    return {
      track: track(userIdentity, userIdentityOptions),
      traits: traits(userIdentity, userIdentityOptions),
      identify: traits(userIdentity, userIdentityOptions),
      account: links(userIdentity, userIdentityOptions)
    };
  };

  sandbox.hull = {
    account,
    user,
    asAcount: account,
    asUser: user
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

  function info(...args) {
    logs.push(args);
    logsForLogger.push(args);
  }

  sandbox.console = { log, warn: log, error: logError, debug, info };

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

  if (sandbox.results.length && isAsync && !_.some(_.compact(sandbox.results), (r) => _.isFunction(r.then))) {
    errors.push("It seems you’re using 'request' which is asynchronous.");
    errors.push("You need to return a 'new Promise' and 'resolve' or 'reject' it in you 'request' callback.");
  }

  return Promise.all(sandbox.results)
    .catch((err) => {
      errors.push(err.toString());
    })
    .then(() => {
      if (preview && tracks.length > 10) {
        logs.unshift([tracks]);
        logs.unshift([`You're trying to send ${tracks.length} 'track' calls at a time. We will only process the first 10`]);
        logs.unshift(["You can't send more than 10 tracking calls in one batch."]);
        tracks = _.slice(tracks, 0, 10);
      }

      return {
        logs,
        logsForLogger,
        errors,
        code,
        userTraits: _.map(userTraitsList, ({ userIdentity, userIdentityOptions, userTraits }) =>
          ({ userIdentity, userIdentityOptions, userTraits: _.reduce(userTraits, buildPayload, {}) })),
        events: tracks,
        accountLinks: accountLinksList,
        payload: sandbox.payload,
        success: true,
        accountTraits: _.map(accountTraitsList, ({ accountIdentity, accountIdentityOptions, accountTraits }) =>
          ({ accountIdentity, accountIdentityOptions, accountTraits: _.reduce(accountTraits, buildPayload, {}) })),
      };
    });
};
