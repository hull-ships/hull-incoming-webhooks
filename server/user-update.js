/* @flow */

import compute from "./compute";
import _ from "lodash";

function isGroup(o) {
  return _.isPlainObject(o) && !_.isEqual(_.sortBy(_.keys(o)), ["operation", "value"]);
}

function flatten(obj, key, group) {
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

module.exports = function handle(payload: Object = {}, { ship, client, metric }: Object) {
  return compute(payload, ship, client)
    .then(({ userTraits, events, accountTraits, accountIdentity, logs, errors, userIdentity }) => {
      let asUser;
      try {
        asUser = client.asUser(userIdentity);
      } catch (err) {
        return client.logger.info("incoming.user.skip", { reason: "missing user ident." });
      }

      asUser.logger.info("compute.user.debug", { userTraits, accountTraits });

      // Update user traits
      if (_.size(userTraits)) {
        asUser.traits(flatten({}, "", userTraits)).then(() => asUser.logger.info("incoming.user.success", { ...flatten({}, "", userTraits) }));
        metric.increment("ship.incoming.users", 1);
      }

      if (_.size(events)) {
        let succeededEvents = 0;
        events.map(({ eventName, properties, context}) => asUser.track(eventName, properties, {
          ip: "0",
          source: "incoming-webhook", ...context
        }).then(
          () => {
            asUser.logger.info("incoming.event.success");
            succeededEvents++;
          },
          (err) => asUser.logger.error("incoming.event.error", { errors: err })
        ));
        metric.increment("ship.incoming.events", succeededEvents);
      }

      // Update account traits
      if (_.size(accountTraits)) {
        asUser.account(accountIdentity).traits(...flatten({}, "", accountTraits)).then(() => asUser.logger.info("incoming.account.success", {
          accountTraits: flatten({}, "", accountTraits),
          accountIdentity
        }));
        metric.increment("ship.incoming.accounts", 1);
      } else if (_.size(accountIdentity) || !_.isMatch(accountTraits, accountIdentity)) {
        // Link account
        asUser.account(accountIdentity).traits({}).then(() => {
          asUser.logger.info("incoming.account.link", { accountTraits, accountIdentity });
        });
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
