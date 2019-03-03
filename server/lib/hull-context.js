// @flow
import type { Hull, HullEventProperties, HullEventContext } from "hull";
import flatten from "./flatten-attributes";
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
  target: Array<Traits>,
  claims: Claims,
  claimsOptions: ClaimsOptions
) => (properties: Attributes, options: AttributesOptions) =>
  target.push({
    claims,
    claimsOptions,
    traits: flatten({ properties, options })
  });

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

  function asAccount(
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

    const identify = identifyFactory(target, claims, claimsOptions);
    return { identify, traits: identify };
  }

  const linksFactory = (claims, claimsOptions, target) => (
    accountClaims: AccountClaims,
    accountClaimsOptions: AccountClaimsOptions
  ) => {
    const account = asAccount(
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
