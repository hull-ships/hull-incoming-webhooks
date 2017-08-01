/* @flow */

import compute from "./compute";
import _ from "lodash";

function isGroup(o) {
  return _.isPlainObject(o) && !_.isEqual(_.sortBy(_.keys(o)), ["operation", "value"]);
}

function flatten(obj: Object, key: string, group: Object) {
  return _.reduce(group, (m, v, k) => {
    const n = (key) ? `${key}/${k}` : k;
    if (isGroup(v)) {
      flatten(m, n, v);
    } else {
      m[n] = v;
    }
    return m;
  }, obj);
}

module.exports = function handle(message: Object = {}, { ship, client }: Object) {
  return compute(message, ship, client)
    .then(({ userTraits, events, accountTraits, accountIdentity, logs, errors, userIdentity }) => {
      const asUser = client.asUser(userIdentity);

      asUser.logger.info("compute.user.debug", { userTraits, accountIdentity });

      // Update user traits
      if (_.size(userTraits)) {
        asUser.traits(flatten({}, "", userTraits)).then(() => asUser.logger.info("incoming.user.success", { ...flatten({}, "", userTraits) }));
      }

      if (_.size(events)) {
        events.map(asUser.track);
      }

      // Update account traits
      if (_.size(accountTraits)) {
        asUser.account(accountIdentity).traits(...flatten({}, "", accountTraits)).then(() => asUser.logger.info("incoming.account.success", {
          accountTraits,
          accountIdentity
        }));
      } else if (_.size(accountIdentity) || !_.isMatch(accountTraits, accountIdentity)) {
        // Link account
        asUser.account(accountIdentity).traits({}).then(() =>
          asUser.logger.info("incoming.account.link", { accountTraits, accountIdentity }));
      }

      if (errors && errors.length > 0) {
        asUser.logger.error("incoming.user.error", { errors });
      }

      if (events.length > 0) {
        events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, {
          ip: "0",
          source: "incoming-webhook", ...context
        }));
      }

      if (errors && errors.length > 0) {
        asUser.logger.error("incoming.user.error", { errors });
      }

      if (logs && logs.length) {
        logs.map(log => asUser.logger.info("compute.console.log", { log }));
      }
    })
    .catch(err => {
      client.logger.error("incoming.user.error", { errors: err });
    });
};
