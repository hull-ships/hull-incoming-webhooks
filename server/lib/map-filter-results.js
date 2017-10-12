import _ from "lodash";

export function filterInvalidIdentities(values, client, subject = "user") {
  return values.filter(u => {
    try {
      if (u.userIdentity && (!u.userIdentity.email && !u.userIdentity.id && !u.userIdentity.external_id && !u.userIdentity.anonymous_id)) {
        client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid ident.", userIdentity: u.userIdentity });
        return false;
      }

      if (u.accountIdentity && (!u.accountIdentity.domain && !u.accountIdentity.id && !u.accountIdentity.external_id)) {
        client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid ident.", accountIdentity: u.accountIdentity });
        return false;
      }

      if (u.userIdentity) {
        client.asUser(u.userIdentity);
      }

      if (u.accountIdentity) {
        client.asAccount(u.accountIdentity);
      }
      return true;
    } catch (err) {
      client.logger.info(`incoming.${subject}.skip`, { reason: "Missing/Invalid Ident.", identity: _.pick(u, ["userIdentity", "accountIdentity"]) });
      return false;
    }
  });
}

export function reducePayload(payloadList: Array<Object>, byKey: string) {
  return _.reduce(payloadList, (acc, payload) => {
    if (!_.filter(acc, alreadyFiltered => _.isEqual(payload.userIdentity, alreadyFiltered.userIdentity)).length) {
      const allUserOccurrences = _.filter(payloadList, pld => _.isEqual(pld.userIdentity, payload.userIdentity));

      acc.push({
        userIdentity: payload.userIdentity,
        [byKey]: _.reduce(allUserOccurrences.map(pld => pld[byKey]), (toMerge, obj) => _.merge(toMerge, obj), {})
      });
      return acc;
    }
    return acc;
  }, []);
}
