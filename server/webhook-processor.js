// @flow
const _ = require("lodash");
const compute = require("./compute");
const debug = require("debug")("hull-incoming-webhooks:webhook-processor");

const {
  filterInvalidIdentities,
  reducePayload,
  reduceAccountPayload,
} = require("./lib/map-filter-results");

function isGroup(o) {
  return (
    _.isPlainObject(o) &&
    !_.isEqual(_.sortBy(_.keys(o)), ["operation", "value"])
  );
}

function flatten(obj, key, group) {
  return _.reduce(
    group,
    (m, v, k) => {
      const n = key ? `${key}/${k}` : k;
      if (isGroup(v)) {
        flatten(m, n, v);
      } else {
        m[n] = v;
      }
      return m;
    },
    obj
  );
}

module.exports = function handle(
  payload: Object = {},
  { ship, client, metric, cachedWebhookPayload }: Object,
  WebhookModel: Object
) {
  return compute(payload, ship, client)
    .then(result => {
      debug("compute.result", result);
      const { logsForLogger, errors } = result;
      let { events, userTraits, accountTraits, accountLinks } = result;
      userTraits = reducePayload(
        filterInvalidIdentities(userTraits, client, "user"),
        "userTraits"
      );
      events = filterInvalidIdentities(events, client, "event");
      accountTraits = reduceAccountPayload(
        filterInvalidIdentities(accountTraits, client, "account"),
        "accountTraits"
      );
      accountLinks = reducePayload(
        filterInvalidIdentities(accountLinks, client, "account.link"),
        "accountIdentity"
      );
      const promises = [];

      client.logger.info("compute.user.debug", { userTraits, accountTraits });

      // Update user traits
      if (_.size(userTraits)) {
        let successfulUsers = 0;
        promises.push(
          Promise.all(
            userTraits.map(u => {
              const asUser = client.asUser(
                u.userIdentity,
                u.userIdentityOptions
              );
              const flatUserTraits = flatten({}, "", u.userTraits);
              return asUser
                .traits(flatUserTraits)
                .then(() =>
                  asUser.logger.info("incoming.user.success", {
                    ...flatUserTraits,
                  })
                )
                .then(() => {
                  successfulUsers += 1;
                })
                .catch(err =>
                  asUser.logger.error("incoming.user.error", { errors: err })
                );
            })
          ).then(() => metric.increment("ship.incoming.users", successfulUsers))
        );
      }

      // Emit events
      if (_.size(events)) {
        let succeededEvents = 0;
        promises.push(
          Promise.all(
            events.map(({ userIdentity, event, userIdentityOptions }) => {
              const asUser = client.asUser(userIdentity, userIdentityOptions);
              const { eventName, properties, context } = event;
              return asUser
                .track(eventName, properties, {
                  ip: "0",
                  source: "incoming-webhook",
                  ...context,
                })
                .then(
                  () => {
                    succeededEvents++;
                    return asUser.logger.info("incoming.event.success");
                  },
                  err =>
                    asUser.logger.error("incoming.event.error", {
                      user: userIdentity,
                      errors: err,
                    })
                );
            })
          ).then(() =>
            metric.increment("ship.incoming.events", succeededEvents)
          )
        );
      }

      // Link accounts with users
      if (_.size(accountLinks)) {
        promises.push(
          Promise.all(
            accountLinks.map(link => {
              const asUser = client.asUser(
                link.userIdentity,
                link.userIdentityOptions
              );
              return asUser
                .account(link.accountIdentity, link.accountIdentityOptions)
                .traits({})
                .then(() =>
                  asUser.logger.info("incoming.account.link.success", {
                    account: link.accountIdentity,
                    user: link.userIdentity,
                  })
                )
                .catch(err =>
                  asUser.logger.info("incoming.account.link.error", {
                    user: link.userIdentity,
                    errors: err,
                  })
                );
            })
          )
        );
      }

      // Update account traits
      if (_.size(accountTraits)) {
        let succeededAccounts = 0;
        promises.push(
          Promise.all(
            accountTraits.map(a => {
              const asAccount = client.asAccount(
                a.accountIdentity,
                a.accountIdentityOptions
              );
              const flatAccountTraits = flatten({}, "", a.accountTraits);
              return asAccount
                .traits({ ...flatAccountTraits })
                .then(() =>
                  asAccount.logger.info("incoming.account.success", {
                    accountTraits: flatAccountTraits,
                    accountIdentity: a.accountIdentity,
                  })
                )
                .then(() => {
                  succeededAccounts += 1;
                })
                .catch(err =>
                  asAccount.logger.error("incoming.account.error", {
                    accountTraits: flatAccountTraits,
                    accountIdentity: a.accountIdentity,
                    errors: err,
                  })
                );
            })
          ).then(() =>
            metric.increment("ship.incoming.accounts", succeededAccounts)
          )
        );
      }

      if (errors && errors.length > 0) {
        client.logger.error("incoming.user.error", {
          hull_summary: `Error Processing user: ${errors.join(", ")}`,
          errors,
        });
      }

      if (logsForLogger && logsForLogger.length) {
        logsForLogger.map(log =>
          client.logger.info("compute.console.log", { log })
        );
      }

      const webhookPayload = cachedWebhookPayload;

      webhookPayload.result = result;
      webhookPayload.result.events = events;
      webhookPayload.result.accountLinks = accountLinks;
      webhookPayload.result.userTraits = userTraits.map(u =>
        _.omit(u, "userIdentityOptions")
      );
      webhookPayload.result.accountTraits = accountTraits.map(a =>
        _.omit(a, "accountIdentityOptions")
      );

      const webhook = new WebhookModel({
        connectorId: ship.id,
        result: webhookPayload.result,
        webhookData: payload,
        date: cachedWebhookPayload.date,
      });

      return Promise.all(promises).then(() => webhook.save());
    })
    .catch(err =>
      client.logger.error("incoming.user.error", {
        hull_summary: `Error Processing user: ${_.get(
          err,
          "message",
          "Unexpected error"
        )}`,
        errors: err,
      })
    );
};
