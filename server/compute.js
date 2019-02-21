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

// Creates a flat object from `/` and `source` parameters
const reducePayload = traits =>
  _.reduce(
    traits,
    (payload, { properties, context = {} } = {}) => {
      if (properties) {
        const { source } = context;
        _.map(
          _.mapKeys(properties, (v, k) =>
            (source ? `${source}/${k}` : k).replace(".", "/")
          ),
          (v, k) => _.setWith(payload, k, v)
        );
      }
      return payload;
    },
    {}
  );

const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}

module.exports = function compute(
  webhookRequest,
  ship = {},
  client = {},
  options = {}
) {
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

  let events = [];
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

  const track = (claims, claimsOptions) => (
    eventName,
    properties = {},
    context = {}
  ) =>
    eventName &&
    events.push({
      claims,
      claimsOptions,
      event: { eventName, properties, context }
    });

  const genericIdentify = target => (claims, claimsOptions) => (
    properties = {},
    context = {}
  ) =>
    target.push({
      claims,
      claimsOptions,
      traits: [{ properties, context }]
    });

  const identify = genericIdentify(userTraitsList);
  const accountIdentify = genericIdentify(accountTraitsList);

  const account = (claims = null, claimsOptions = {}) => {
    if (claims) {
      const account_identify = accountIdentify(claims, claimsOptions);
      return { identify: account_identify, traits: account_identify };
    }
    return errors.push("Account identity cannot be empty");
  };

  const links = (claims, claimsOptions) => (
    accountClaims = {},
    accountClaimsOptions = {}
  ) => {
    accountLinksList.push({
      claims,
      claimsOptions,
      accountClaims,
      accountClaimsOptions
    });
    return account(claims, claimsOptions);
  };

  const user = (claims = {}, claimsOptions = {}) => {
    try {
      client.asUser(claims);
    } catch (err) {
      errors.push(
        `Encountered error while calling asUser : ${_.get(err, "message", "")}`
      );
    }
    return {
      track: track(claims, claimsOptions),
      traits: identify(claims, claimsOptions),
      identify: identify(claims, claimsOptions),
      account: links(claims, claimsOptions)
    };
  };

  sandbox.hull = {
    /* Deprecated Syntax */
    account,
    user,
    /* Proper Syntax */
    asAccount: account,
    asUser: user
  };

  sandbox.request = (opts, callback) => {
    isAsync = true;
    return request.defaults({ timeout: 3000 })(
      opts,
      (error, response, body) => {
        try {
          callback(error, response, body);
        } catch (err) {
          errors.push(err.toString());
        }
      }
    );
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

  if (
    sandbox.results.length &&
    isAsync &&
    !_.some(_.compact(sandbox.results), r => _.isFunction(r.then))
  ) {
    errors.push("It seems you’re using 'request' which is asynchronous.");
    errors.push(
      "You need to return a 'new Promise' and 'resolve' or 'reject' it in you 'request' callback."
    );
  }

  return Promise.all(sandbox.results)
    .catch(err => {
      errors.push(err.toString());
    })
    .then(() => {
      if (preview && events.length > 10) {
        logs.unshift([events]);
        logs.unshift([
          `You're trying to send ${
            events.length
          } 'track' calls at a time. We will only process the first 10`
        ]);
        logs.unshift([
          "You can't send more than 10 tracking calls in one batch."
        ]);
        events = _.slice(events, 0, 10);
      }

      const userTraits = _.map(
        userTraitsList,
        ({ claims, claimsOptions, traits }) => ({
          claims,
          claimsOptions,
          traits: reducePayload(traits)
        })
      );
      const accountTraits = _.map(
        accountTraitsList,
        ({ claims, claimsOptions, traits }) => ({
          claims,
          claimsOptions,
          traits: reducePayload(traits)
        })
      );

      return {
        logs,
        logsForLogger,
        errors,
        code,
        userTraits,
        accountTraits,
        events,
        accountLinks: accountLinksList,
        payload: sandbox.payload,
        success: true
      };
    });
};
