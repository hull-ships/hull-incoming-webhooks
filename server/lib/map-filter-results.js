// @flow
const _ = require("lodash");

module.exports.filterInvalidIdentities = (values, client, subject = "user") => {
  return values.filter(u => {
    // We would like to check if user ident and account ident is valid so we are checking if all fields that are required
    // are present and try to actually call asUser and asAccount methods to see if there will be no errors
    try {
      if (
        u.userIdentity &&
        (!u.userIdentity.email &&
          !u.userIdentity.id &&
          !u.userIdentity.external_id &&
          !u.userIdentity.anonymous_id)
      ) {
        client.logger.info(`incoming.${subject}.skip`, {
          reason: "Missing/Invalid ident.",
          userIdentity: u.userIdentity,
        });
        return false;
      }

      if (
        u.accountIdentity &&
        (!u.accountIdentity.domain &&
          !u.accountIdentity.id &&
          !u.accountIdentity.external_id)
      ) {
        client.logger.info(`incoming.${subject}.skip`, {
          reason: "Missing/Invalid ident.",
          accountIdentity: u.accountIdentity,
        });
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
      client.logger.info(`incoming.${subject}.skip`, {
        reason: "Missing/Invalid Ident.",
        identity: _.pick(u, ["userIdentity", "accountIdentity"]),
      });
      return false;
    }
  });
};

module.exports.reducePayload = (payloadList: Array<Object>, byKey: string) => {
  return _.reduce(
    payloadList,
    (acc, payload) => {
      if (
        !_.filter(acc, alreadyFiltered =>
          _.isEqual(payload.userIdentity, alreadyFiltered.userIdentity)
        ).length
      ) {
        const allUserOccurrences = _.filter(payloadList, pld =>
          _.isEqual(pld.userIdentity, payload.userIdentity)
        );

        acc.push({
          userIdentity: payload.userIdentity,
          [byKey]: _.reduce(
            allUserOccurrences.map(pld => pld[byKey]),
            (toMerge, obj) => _.merge(toMerge, obj),
            {}
          ),
        });
        return acc;
      }
      return acc;
    },
    []
  );
};

module.exports.reduceAccountPayload = (
  payloadList: Array<Object>,
  byKey: string
) => {
  return _.reduce(
    payloadList,
    (acc, payload) => {
      if (
        !_.filter(acc, alreadyFiltered =>
          _.isEqual(payload.accountIdentity, alreadyFiltered.accountIdentity)
        ).length
      ) {
        const allAccountOccurrences = _.filter(payloadList, pld =>
          _.isEqual(pld.accountIdentity, payload.accountIdentity)
        );

        acc.push({
          accountIdentity: payload.accountIdentity,
          [byKey]: _.reduce(
            allAccountOccurrences.map(pld => pld[byKey]),
            (toMerge, obj) => _.merge(toMerge, obj),
            {}
          ),
        });
        return acc;
      }
      return acc;
    },
    []
  );
};
