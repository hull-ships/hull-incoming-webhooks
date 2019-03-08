// @flow
import type { Hull, HullEventProperties, HullEventContext } from "hull";

import type {
  Claims,
  ClaimsOptions,
  AccountClaims,
  AccountClaimsOptions,
  Attributes,
  AttributesOptions,
  Event,
  Result,
  Traits
} from "../../types";
import { hasValidUserClaims, hasValidAccountClaims } from "./validate-claims";

const trackFactory = (
  claims: Claims,
  claimsOptions: ClaimsOptions,
  target: Array<Event>
) => (
  eventName: string,
  properties: HullEventProperties = {},
  context: HullEventContext = {}
) => {
  target.push({
    claims,
    claimsOptions,
    event: { eventName, properties, context }
  });
};
const identifyFactory = (
  claims: Claims,
  claimsOptions: ClaimsOptions,
  target: Array<Traits>
) => (attributes: Attributes, context: AttributesOptions) => {
  target.push({
    claims,
    claimsOptions,
    traits: { attributes, context }
  });
};

const buildHullContext = (
  client: Hull,
  { errors, userTraits, accountTraits, accountLinks, events }: Result
) => {
  const errorLogger = (message, method, validation) => {
    client.logger.info(`incoming.${message}.skip`, {
      method,
      validation
    });
    errors.push(
      `Error validating claims for ${method}  ${JSON.stringify(validation)}`
    );
  };

  function asAccountFactory(
    claims: AccountClaims,
    claimsOptions: AccountClaimsOptions,
    target: Array<Traits>
  ) {
    const validation = hasValidAccountClaims(claims, claimsOptions, client);
    const { valid } = validation;
    if (!valid) {
      errorLogger("user", "Hull.asAccount()", validation);
      return {};
    }

    const identify = identifyFactory(claims, claimsOptions, target);
    return { identify, traits: identify };
  }

  const linksFactory = (claims, claimsOptions, target) => (
    accountClaims: AccountClaims,
    accountClaimsOptions: AccountClaimsOptions
  ) => {
    const account = asAccountFactory(
      accountClaims,
      accountClaimsOptions,
      accountTraits
    );
    if (!account.traits) {
      return {};
    }
    target.push({
      claims,
      claimsOptions,
      accountClaims,
      accountClaimsOptions
    });
    return account;
  };

  function asAccount(claims: Claims, claimsOptions: ClaimsOptions) {
    return asAccountFactory(claims, claimsOptions, accountTraits);
  }
  function asUser(claims: Claims, claimsOptions: ClaimsOptions) {
    const validation = hasValidUserClaims(claims, claimsOptions, client);
    const { valid, error } = validation;
    if (!valid || error) {
      errorLogger("user", "Hull.asUser()", validation);
      return {};
    }
    const identify = identifyFactory(claims, claimsOptions, userTraits);
    const track = trackFactory(claims, claimsOptions, events);
    const link = linksFactory(claims, claimsOptions, accountLinks);
    return {
      traits: identify,
      account: link,
      identify,
      track
    };
  }

  return {
    /* Deprecated Syntax */
    user: asUser,
    account: asAccount,
    /* Proper Syntax */
    asUser,
    asAccount
  };
};

export default buildHullContext;
