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

function filterInvalidIdentities(values, client, object = "user") {
  return values.filter(u => {
    try {
      if (u.userIdentity && (!u.userIdentity.email && !u.userIdentity.id && !u.userIdentity.external_id && !u.userIdentity.anonymous_id)) {
        client.logger.info(`incoming.${object}.skip`, { reason: "Missing/Invalid ident.", userIdentity: u.userIdentity });
        return false;
      }

      if (u.accountIdentity && (!u.accountIdentity.domain && !u.accountIdentity.id && !u.accountIdentity.external_id)) {
        client.logger.info(`incoming.${object}.skip`, { reason: "Missing/Invalid ident.", accountIdentity: u.accountIdentity });
        return false;
      }

      if (u.userIdentity) {
        client.asUser(u.userIdentity);
      }

      if (u.accountIdentity) {
        client.asAccount(u.accountIdentity);
      }
      return true;
    } catch (err) {
      client.logger.info(`incoming.${object}.skip`, { reason: "Missing/Invalid ident.", identity: _.get(u, ["userIdentity", "accountIdentity"]) });
      return false;
    }
  });
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
          return asUser.account(link.accountIdentity, link.accountIdentityOptions)
            .then(() => asUser.logger.info("incoming.account.link", { account: link.accountIdentity, user: link.userIdentity }))
            .catch(err => client.logger.info("incoming.account.link.error", { user: link.userIdentity, errors: err }));
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
      webhookPayload.result.accountLinks = accountLinks;
      webhookPayload.result.userTraits = webhookPayload.result.userTraits.map(u => _.omit(u, "userIdentityOptions"));
      webhookPayload.result.accountTraits = webhookPayload.result.accountTraits.map(a => _.omit(a, "accountIdentityOptions"));

      const webhook = new WebhookModel({ result: payload.result, webhookData: payload.webhookData, date: payload.date });

      return webhook.save(payload);
    })
    .catch(err =>
      client.logger.error("incoming.user.error", { hull_summary: `Error Processing user: ${_.get(err, "message", "Unexpected error")}`, errors: err }));
};
