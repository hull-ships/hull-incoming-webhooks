import _ from "lodash";

export const isValidClaim = (payload, client) => subject => {
  const { claims } = payload;
  try {
    const method = subject === "account" ? client.asAccount : client.asUser;
    return method(claims) && true;
  } catch (err) {
    console.log(err);
    client.logger.info(`incoming.${subject}.skip`, {
      reason: "Missing/Invalid Ident.",
      identity: { claims, subject }
    });
    return false;
  }
};
export const withValidClaims = subjects => client => payload =>
  _.filter(payload, p =>
    _.every(_.castArray(subjects), isValidClaim(p, client))
  );

export const withValidUserClaims = withValidClaims("user");
export const withValidAccountClaims = withValidClaims("account");
export const withValidUserOrAccountClaims = withValidClaims([
  "account",
  "user"
]);
