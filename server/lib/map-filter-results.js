import _ from "lodash";

export const isValidClaim = (payload, client) => subject => {
  const claim = payload[`${subject}Claims`];
  try {
    const method = subject === "account" ? client.asAccount : client.asUser;
    return method(claim) && true;
  } catch (err) {
    console.log(err);
    client.logger.info(`incoming.${subject}.skip`, {
      reason: "Missing/Invalid Ident.",
      identity: { claim, subject }
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

function isGroup(o) {
  return (
    _.isPlainObject(o) &&
    !_.isEqual(_.sortBy(_.keys(o)), ["operation", "value"])
  );
}

export function flatten(obj, key, group) {
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

// groups the payload by Claim
export const groupByClaim = (
  claimType: string = "userClaims",
  payloads: Array<Object>
) =>
  _.reduce(
    payloads,
    (memo, payload) => {
      const claim = payload[claimType];
      const isSamePayload = f => _.isEqual(f[claimType], claim);
      const o = _.find(memo, isSamePayload);
      if (o) {
        Object.assign(o, payload)
      } else {
        memo.push({
          ...payload
        })
      }
      // // If we already have an identical Claim set in the memo, return.
      // if (_.some(memo, isSamePayload)) {
      //   return memo;
      // }
      // memo.push(
      //   _.reduce(
      //     _.filter(payloads, isSamePayload),
      //     (m, p) => _.each(p, (v, k) => (m[k] = flatten(v))) && m,
      //     {}
      //   )
      // );
      return memo;
    },
    []
  );
