import _ from "lodash";

export function filterInvalidIdentities(values, client, subject = "user") {
  return values.filter(u => {
    // We would like to check if user ident and account ident is valid so we are checking if all fields that are required
    // are present and try to actually call asUser and asAccount methods to see if there will be no errors
    try {
      if (u.userClaims && (!u.userClaims.email && !u.userClaims.id && !u.userClaims.external_id && !u.userClaims.anonymous_id)) {
        client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid ident.", userClaims: u.userClaims });
        return false;
      }

      if (u.accountClaims && (!u.accountClaims.domain && !u.accountClaims.id && !u.accountClaims.external_id)) {
        client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid ident.", accountClaims: u.accountClaims });
        return false;
      }

      if (u.userClaims) {
        client.asUser(u.userClaims);
      }

      if (u.accountClaims) {
        client.asAccount(u.accountClaims);
      }
      return true;
    } catch (err) {
      client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid Ident.", identity: _.pick(u, ["userClaims", "accountClaims"]) });
      return false;
    }
  });
}

export function reducePayload(payloadList: Array<Object>, byKey: string) {
  return _.reduce(payloadList, (acc, payload) => {
    if (!_.filter(acc, alreadyFiltered => _.isEqual(payload.userClaims, alreadyFiltered.userClaims)).length) {
      const allUserOccurrences = _.filter(payloadList, pld => _.isEqual(pld.userClaims, payload.userClaims));

      acc.push({
        userClaims: payload.userClaims,
        [byKey]: _.reduce(allUserOccurrences.map(pld => pld[byKey]), (toMerge, obj) => _.merge(toMerge, obj), {})
      });
      return acc;
    }
    return acc;
  }, []);
}


export function reduceAccountPayload(payloadList: Array<Object>, byKey: string) {
  return _.reduce(payloadList, (acc, payload) => {
    if (!_.filter(acc, alreadyFiltered => _.isEqual(payload.accountClaims, alreadyFiltered.accountClaims)).length) {
      const allAccountOccurrences = _.filter(payloadList, pld => _.isEqual(pld.accountClaims, payload.accountClaims));

      acc.push({
        accountClaims: payload.accountClaims,
        [byKey]: _.reduce(allAccountOccurrences.map(pld => pld[byKey]), (toMerge, obj) => _.merge(toMerge, obj), {})
      });
      return acc;
    }
    return acc;
  }, []);
}
