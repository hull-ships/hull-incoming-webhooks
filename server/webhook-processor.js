/* @flow */
import compute from "./compute";
import _ from "lodash";

import { filterInvalidIdentities, reducePayload } from "./lib/map-filter-results";

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

module.exports = function handle(payload: Object = {}, { ship, client, metric, service, cachedWebhookPayload }: Object) {
  return compute(payload, ship, client)
    .then(result => {
      const { logs, errors } = result;
      let { events, userTraits, accountTraits, accountLinks } = result;
      userTraits = filterInvalidIdentities(userTraits, client, "user");
      events = filterInvalidIdentities(events, client, "event");
      accountTraits = filterInvalidIdentities(accountTraits, client, "account");
      accountLinks = filterInvalidIdentities(accountLinks, client, "account.link");

      client.logger.info("compute.user.debug", { userTraits, accountTraits });

      // Update user traits
      if (_.size(userTraits)) {
        let successfulUsers = 0;
        Promise.all(userTraits.map(u => {
          const asUser = client.asUser(u.userIdentity, u.userIdentityOptions);
          return asUser.traits(flatten({}, "", u.userTraits)).then(() => asUser.logger.info("incoming.user.success", { ...flatten({}, "", u.userTraits) }))
            .then(() => {
              successfulUsers += 1;
            })
            .catch(err => client.logger.error("incoming.user.error", { errors: err }));
        })).then(() => metric.increment("ship.incoming.users", successfulUsers));
      }

      // Emit events
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
            err => client.logger.error("incoming.event.error", { user: userIdentity, errors: err })
          );
        })).then(() => metric.increment("ship.incoming.events", succeededEvents));
      }

      // Update account traits
      if (_.size(accountTraits)) {
        let succeededAccounts = 0;
        Promise.all(accountTraits.map(a => {
          const asAccount = client.asAccount(a.accountIdentity, a.accountIdentityOptions);
          return asAccount.traits(...flatten({}, "", a.accountTraits)).then(() => client.logger.info("incoming.account.success", {
            accountTraits: flatten({}, "", a.accountTraits),
            accountIdentity: a.accountIdentity
          }))
            .then(() => {
              succeededAccounts += 1;
            })
            .catch(err => client.logger.error("incoming.account.error", {
              accountTraits: flatten({}, "", a.accountTraits),
              accountIdentity: a.accountIdentity,
              errors: err
            }));
        })).then(() => metric.increment("ship.incoming.accounts", succeededAccounts));
      }

      // Link accounts with users
      if (_.size(accountLinks)) {
        Promise.all(accountLinks.map(link => {
          const asUser = client.asUser(link.userIdentity, link.userIdentityOptions);
          try {
            asUser.account(link.accountIdentity, link.accountIdentityOptions)
          } catch (err) {
            return client.logger.info("incoming.account.link.error", { user: link.userIdentity, errors: err })
          }
          return asUser.logger.info("incoming.account.link", { account: link.accountIdentity, user: link.userIdentity })
        }));
      }

      if (errors && errors.length > 0) {
        client.logger.error("incoming.user.error", { hull_summary: `Error Processing user: ${errors.join(", ")}`, errors });
      }

      if (logs && logs.length) {
        logs.map(log => client.logger.info("compute.console.log", { log }));
      }

      const { WebhookModel } = service || {};

      const webhookPayload = cachedWebhookPayload;

      webhookPayload.result = result;
      webhookPayload.result.events = events;
      webhookPayload.result.accountLinks = reducePayload(accountLinks, "accountIdentity");
      webhookPayload.result.userTraits = reducePayload(userTraits.map(u => _.omit(u, "userIdentityOptions")), "userTraits");
      webhookPayload.result.accountTraits = reducePayload(accountTraits.map(a => _.omit(a, "accountIdentityOptions")), "accountTraits");

      const webhook = new WebhookModel({ result: webhookPayload.result, webhookData: payload, date: cachedWebhookPayload.date });

      return webhook.save(payload);
    })
    .catch(err =>
      client.logger.error("incoming.user.error", { hull_summary: `Error Processing user: ${_.get(err, "message", "Unexpected error")}`, errors: err }));
};
