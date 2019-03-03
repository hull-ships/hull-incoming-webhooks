// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import fp from "lodash/fp";

import Area from "../ui/area";
import CodeTitle from "../ui/code-title";
import type { Result } from "../../../types";

const nice = (obj = {}) => JSON.stringify(obj, null, 2);
const short = (obj = {}) => JSON.stringify(obj);
// const conditional = (data, text) => {
//   if (!data || !_.size(data)) return "";
//   return `/* ${text} */ ${_.isObject(data) ? nice(data) : data}`;
// };
const joinLines = fp.join("\n");

const renderClaimsOptions = (options = {}) =>
  _.size(options) ? `,${short(options)}` : "";

const renderUserClaim = ({ claims, claimsOptions }) =>
  `hull.asUser(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

const renderAccountClaim = ({ claims, claimsOptions }) =>
  `hull.asAccount(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

const renderUserTraits = ({ claims, traits, claimsOptions }) =>
  `${renderUserClaim({ claims, claimsOptions })}
.traits(${nice(traits)}});`;

const renderAccountTraits = ({ claims, traits, claimsOptions }) =>
  `${renderAccountClaim({ claims, claimsOptions })}
.traits(${nice(traits)}});`;

const mapTraits = method =>
  fp.flow(
    fp.map(method),
    joinLines
  );

const renderStringOrObject = i => (_.isString(i) ? i : nice(i));

const renderLogs = fp.flow(
  fp.map(fp.map(renderStringOrObject), fp.join(", ")),
  joinLines
);

const mapAccountLinks = fp.flow(
  fp.map(
    ({ claims, accountClaims }) => `/* User */ ${short(claims)}
/* -> Account */ ${short(accountClaims)}
`
  ),
  joinLines
);

const renderEventBody = ({ eventName, context, properties }) =>
  `"${eventName}", ${nice(properties)}, ${nice(context)}`;

const renderEvent = ({
  event,
  claims,
  claimsOptions
}) => `// <--------- Event --------->
${renderUserClaim({ claims, claimsOptions })}
.track(${renderEventBody(event)})`;

const mapEvents = fp.flow(
  fp.map(renderEvent),
  joinLines
);

type Props = {
  result: Result
};

const Preview = ({ result }: Props) => {
  const {
    userTraits = [],
    accountTraits = [],
    accountLinks = [],
    errors = [],
    events = [],
    logs = []
  } = result;

  const highlight =
    errors && errors.length && !_.isEmpty(userTraits)
      ? []
      : _.map(_.keys(userTraits.map(u => u.traits)), k => `traits_${k}`) || [];
  const hasErrors = _.size(errors);

  const output = {
    "User Attributes": mapTraits(renderUserTraits)(userTraits),
    "Account Attributes": mapTraits(renderAccountTraits)(accountTraits),
    "User-Account Links": mapAccountLinks(accountLinks),
    "User Events": mapEvents(events)
  };

  return hasErrors ? (
    <Fragment>
      <CodeTitle title="Errors" error />
      <Area
        highlight={highlight}
        value={errors}
        type="danger"
        javascript={false}
      />
    </Fragment>
  ) : (
    <Fragment>
      {_.map(_.pickBy(output, v => !!v), (v, k) => (
        <Fragment>
          <CodeTitle title={k} />
          <Area value={v} type="info" />
        </Fragment>
      ))}
      <CodeTitle title="Console" />
      <Area value={renderLogs(logs)} type="info" javascript={false} />
    </Fragment>
  );
};
export default Preview;
