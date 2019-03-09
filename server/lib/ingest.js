// @flow
import _ from "lodash";
import type { HullConnector, Hull, Metric } from "hull";
import { callLinks, callEvents, callTraits } from "./side-effects";
import type { Entry, Payload, Result } from "../../types";

const debug = require("debug")("hull-incoming-webhooks:ingest");

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));

module.exports = async function ingest(
  {
    result,
    code,
    ship,
    client,
    metric,
    payload
  }: {
    result: Result,
    code: string,
    ship: HullConnector,
    client: Hull,
    metric: Metric,
    payload: Payload
  },
  EntryModel: Object
) {
  debug("ingest.result", result);

  const {
    events,
    userTraits,
    accountTraits,
    accountLinks,
    logsForLogger,
    errors
  } = result;

  const promises = [];

  client.logger.info("compute.user.debug", result);

  // Update user traits
  if (_.size(userTraits)) {
    promises.push(callTraits(client.asUser, userTraits, "user", metric));
  }

  // Update account traits
  if (_.size(accountTraits)) {
    promises.push(
      callTraits(client.asAccount, accountTraits, "account", metric)
    );
  }

  // Emit events
  if (_.size(events)) {
    promises.push(callEvents(client.asUser, events, "event", metric));
  }

  // Link accounts with users
  if (_.size(accountLinks)) {
    promises.push(callLinks(client.asUser, accountLinks, "account", metric));
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

  await Promise.all(promises);

  const entry: Entry = {
    connectorId: ship.id,
    code,
    result,
    payload,
    date: new Date().toString()
  };
  return EntryModel && EntryModel.create(entry);
};
