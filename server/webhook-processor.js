import _ from "lodash";
import compute from "./compute";

import {
  withValidUserClaims,
  withValidAccountClaims,
  withValidUserOrAccountClaims
} from "./lib/map-filter-results";

const debug = require("debug")("hull-incoming-webhooks:webhook-processor");

module.exports = function handle(
  payload = {},
  { ship, client, metric, cachedWebhookPayload },
  WebhookModel
) {
  return compute(payload, ship, client)
    .then(result => {
      debug("compute.result", result);
      const { logsForLogger, errors } = result;
      const events = withValidUserClaims(client)(result.events);
      const userTraits = withValidUserClaims(client)(result.userTraits);
      const accountTraits = withValidAccountClaims(client)(
        result.accountTraits
      );
      const accountLinks = withValidUserOrAccountClaims(client)(
        result.accountLinks
      );
      const promises = [];

      client.logger.info("compute.user.debug", { userTraits, accountTraits });

      const callTraits = (hullClient, data, entity = "user") => {
        let successful = 0;
        return Promise.all(
          data.map(({ traits, claims, claimsOptions }) => {
            const c = hullClient(claims, claimsOptions);
            return c.traits(traits).then(
              () => {
                successful += 1;
                return c.logger.info(`incoming.${entity}.success`, traits);
              },
              err => {
                return c.logger.error(`incoming.${entity}.error`, {
                  errors: err
                });
              }
            );
          })
        ).then(() => {
          metric.increment(`ship.incoming.${entity}s`, successful);
        });
      };

      // Update user traits
      if (_.size(userTraits)) {
        promises.push(callTraits(client.asUser, userTraits, "user"));
      }

      // Update account traits
      if (_.size(accountTraits)) {
        promises.push(callTraits(client.asAccount, accountTraits, "account"));
      }

      // Emit events
      if (_.size(events)) {
        let successfulEvents = 0;
        promises.push(
          Promise.all(
            events.map(({ event, claims, claimsOptions }) => {
              const asUser = client.asUser(claims, claimsOptions);
              const { eventName, properties, context } = event;
              return asUser
                .track(eventName, properties, {
                  ip: "0",
                  source: "incoming-webhook",
                  ...context
                })
                .then(
                  () => {
                    successfulEvents += 1;
                    return asUser.logger.info("incoming.event.success");
                  },
                  err =>
                    asUser.logger.error("incoming.event.error", {
                      user: claims,
                      errors: err
                    })
                );
            })
          ).then(() =>
            metric.increment("ship.incoming.events", successfulEvents)
          )
        );
      }

      // Link accounts with users
      if (_.size(accountLinks)) {
        promises.push(
          Promise.all(
            accountLinks.map(link => {
              const asUser = client.asUser(link.claims, link.claimsOptions);
              return asUser
                .account(link.accountClaims, link.accountClaimsOptions)
                .traits({})
                .then(() =>
                  asUser.logger.info("incoming.account.link.success", {
                    account: link.accountClaims,
                    user: link.claims
                  })
                )
                .catch(err =>
                  asUser.logger.info("incoming.account.link.error", {
                    user: link.claims,
                    errors: err
                  })
                );
            })
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
