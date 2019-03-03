// @flow
import type { Hull } from "hull";
import type {
  ClaimsValidation,
  Claims,
  ClaimsOptions,
  ClaimsSubject
} from "../../types";

export const isValidClaim = (
  claims: Claims,
  claimsOptions: ClaimsOptions,
  client: Hull
) => (subject: ClaimsSubject): ClaimsValidation => {
  try {
    const method = subject === "account" ? client.asAccount : client.asUser;
    return (
      method(claims) && {
        valid: true,
        error: undefined,
        message: undefined,
        claims,
        claimsOptions,
        subject
      }
    );
  } catch (err) {
    return {
      valid: false,
      message: `Invalid Claims for ${subject}`,
      error: err.toString(),
      claims,
      claimsOptions,
      subject
    };
  }
};

export const hasValidClaims = (subject: ClaimsSubject) => (
  claims: Claims,
  claimsOptions: ClaimsOptions,
  client: Hull
) => isValidClaim(claims, claimsOptions, client)(subject);

export const hasValidUserClaims = hasValidClaims("user");
export const hasValidAccountClaims = hasValidClaims("account");
