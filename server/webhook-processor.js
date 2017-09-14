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

module.exports = function handle(payload: Object = {}, { ship, client, metric, cache }: Object) {
  return compute(payload, ship, client)
    .then(result => {
      const { userTraits, events, accountTraits, accountIdentity, logs, errors } = result;
      try {
        userTraits.map(u => client.asUser(u.userIdentity));
      } catch (err) {
        client.logger.info("incoming.user.skip", { reason: "missing/invalid user ident." });
      }

      client.logger.info("compute.user.debug", { userTraits, accountTraits });

      // Update user traits
      if (_.size(userTraits)) {
        let successfulUsers = 0;
        Promise.all(userTraits.map(u => {
          const asUser = client.asUser(u.userIdentity, u.userIdentityOptions);
          asUser.traits(flatten({}, "", u.traits)).then(() => asUser.logger.info("incoming.user.success", { ...flatten({}, "", u.traits) }))
            .then(() => successfulUsers += 1)
            .catch(err => client.logger.error("incoming.user.error", { errors: err }));
        })).then(() => metric.increment("ship.incoming.users", successfulUsers));
      }

      if (_.size(events)) {
        let succeededEvents = 0;
        Promise.all(events.map(({ userIdentity, event, userIdentityOptions }) => {
          const asUser = client.asUser(userIdentity, userIdentityOptions);
          const { eventName, properties, context } = event;
          return asUser.track(eventName, properties, {
            ip: "0",
            source: "incoming-webhook", ...context
          }).then(
            () => {
              succeededEvents++;
              return asUser.logger.info("incoming.event.success");
            },
            err => asUser.logger.error("incoming.event.error", { errors: err })
          )
        })).then(() => metric.increment("ship.incoming.events", succeededEvents));
      }

      // Update account traits
      if (_.size(accountTraits)) {
        let succeededAccounts = 0;
        Promise.all(accountTraits.map(a => {
          const asAccount = client.asAccount(a.accountIdentity, a.accountIdentityOptions);
          asAccount.traits(...flatten({}, "", accountTraits)).then(() => client.logger.info("incoming.account.success", {
            accountTraits: flatten({}, "", accountTraits),
            accountIdentity
          })).then(() => succeededAccounts += 1);
        })).then(() => metric.increment("ship.incoming.accounts", succeededAccounts));
      }
      // TODO
      // else if (_.size(accountTraits) || !_.isMatch(accountTraits, accountIdentity)) {
      //   Link account
        // asUser.account(accountIdentity).traits({}).then(() => {
        //   asUser.logger.info("incoming.account.link", { accountTraits, accountIdentity });
        // });
      // }

      if (errors && errors.length > 0) {
        client.logger.error("incoming.user.error", { hull_summary: `Error Processing user: ${errors.join(", ")}`, errors });
      }

      if (logs && logs.length) {
        logs.map(log => client.logger.info("compute.console.log", { log }));
      }

      const key = `${_.get(ship, "id")}-webhook-requests`;
      return cache.get(key)
        .then(requests => {
            const request = _.find(requests, request => _.isEqual(request.webhookData, payload));
            request.result = result;
            request.result.userTraits = request.result.userTraits.map(u => _.omit(u, "userIdentityOptions"));
            request.result.accountTraits = request.result.accountTraits.map(a => _.omit(a, "accountIdentityOptions"));
            return requests;
        })
        .then(requests => cache.set(key, requests, { ttl: 1440000000 }))
    })
    .catch(err => {
      client.logger.error("incoming.user.error", { hull_summary: `Error Processing user: ${_.get(err, "message", "Unexpected error")}`, errors: err });
    });
};
