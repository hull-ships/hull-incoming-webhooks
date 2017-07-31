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
    .then(({ changes, events, accountIdentity, accountTraits, logs, errors, userIdentity }) => {
      const asUser = client.asUser(userIdentity);

      asUser.logger.info("compute.user.debug", { changes, accountTraits });

      // Update user traits
      if (_.size(changes)) {
        asUser.traits(...changes).then(() => asUser.logger.info("incoming.user.success", { ...changes }));
      }

      if (_.size(events)) {
        events.map(asUser.track);
      }

      // Update account traits
      if (_.size(changes.account)) {
        const flat = {
          ...changes.account.traits,
          ...flatten({}, "", _.omit(changes.account, "traits")),
        };

        if (_.size(flat)) {
          asUser.account(accountTraits).traits(flat).then(() => asUser.logger.info("incoming.account.success", {
            account: _.pick(accountIdentity, "id"),
            accountTraits,
            changes: flat
          }));
        }
      } else if (_.size(accountTraits) && (_.size(account) || !_.isMatch(accountIdentity, accountTraits))) {
        // Link account
        asUser.account(accountTraits).traits({}).then(() =>
          asUser.logger.info("incoming.account.link", { account: _.pick(accountIdentity, "id"), accountTraits }));
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
