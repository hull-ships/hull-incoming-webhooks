import _ from "lodash";
import compute from "./compute";
const debug = require("debug")("hull-incoming-webhooks:webhook-processor");

import {
  withValidUserClaims,
  withValidAccountClaims,
  withValidUserOrAccountClaims,
  groupByClaim,
  flatten
} from "./lib/map-filter-results";

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
      events = withValidUserClaims(client)(events);
      userTraits = groupByClaim(
        "userClaims",
        withValidUserClaims(client)(userTraits)
      );
      accountTraits = groupByClaim(
        "accountClaims",
        withValidAccountClaims(client)(accountTraits)
      );
      accountLinks = groupByClaim(
        "accountClaims",
        withValidUserOrAccountClaims(client)(accountLinks)
      );
      const promises = [];

      client.logger.info("compute.user.debug", { userTraits, accountTraits });

      // Update user traits
      if (_.size(userTraits)) {
        let successfulUsers = 0;
        promises.push(
          Promise.all(
            userTraits.map(({ userTraits, userClaims, userClaimsOptions}) => {
              const asUser = client.asUser(userClaims, userClaimsOptions);
              return asUser
                .traits(flatten({}, "", userTraits))
                .then(() =>
                  asUser.logger.info("incoming.user.success", {
                    ...flatten({}, "", userTraits)
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
            events.map(({ userClaims, event, userClaimsOptions }) => {
              const asUser = client.asUser(userClaims, userClaimsOptions);
              const { eventName, properties, context } = event;
              return asUser
                .track(eventName, properties, {
                  ip: "0",
                  source: "incoming-webhook",
                  ...context
                })
                .then(
                  () => {
                    succeededEvents++;
                    return asUser.logger.info("incoming.event.success");
                  },
                  err =>
                    asUser.logger.error("incoming.event.error", {
                      user: userClaims,
                      errors: err
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
                link.userClaims,
                link.userClaimsOptions
              );
              return asUser
                .account(link.accountClaims, link.accountClaimsOptions)
                .traits({})
                .then(() =>
                  asUser.logger.info("incoming.account.link.success", {
                    account: link.accountClaims,
                    user: link.userClaims
                  })
                )
                .catch(err =>
                  asUser.logger.info("incoming.account.link.error", {
                    user: link.userClaims,
                    errors: err
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
                a.accountClaims,
                a.accountClaimsOptions
              );
              return asAccount
                .traits({ ...flatten({}, "", a.accountTraits) })
                .then(() =>
                  asAccount.logger.info("incoming.account.success", {
                    accountTraits: flatten({}, "", a.accountTraits),
                    accountClaims: a.accountClaims
                  })
                )
                .then(() => {
                  succeededAccounts += 1;
                })
                .catch(err =>
                  asAccount.logger.error("incoming.account.error", {
                    accountTraits: flatten({}, "", a.accountTraits),
                    accountClaims: a.accountClaims,
                    err
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
          errors
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
        _.omit(u, "userClaimsOptions")
      );
      webhookPayload.result.accountTraits = accountTraits.map(a =>
        _.omit(a, "accountClaimsOptions")
      );

      const webhook = new WebhookModel({
        connectorId: ship.id,
        result: webhookPayload.result,
        webhookData: payload,
        date: cachedWebhookPayload.date
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
        err
      })
    );
};
