import React, { Component } from "react";
import _ from "lodash";
import fp from "lodash/fp";
import { Row } from "react-bootstrap";

import CodePane from "../code";
import Errors from "./errors";
import Output from "./output";

const nice = (obj = {}) => JSON.stringify(obj, null, 2);
const short = (obj = {}) => JSON.stringify(obj);
const conditional = (data, text) => {
  if (!data || !_.size(data)) return "";
  return `/* ${text} */ ${_.isObject(data) ? nice(data) : data}`;
};
const joinLines = fp.join("\n");

const renderClaimsOptions = (options = {}) =>
  _.size(options) ? `,${short(options)}` : "";

const renderUserClaim = ({ claims, claimsOptions }) =>
  `Hull.asUser(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

const renderAccountClaim = ({ claims, claimsOptions }) =>
  `Hull.asAccount(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

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
    ({ claims, accountClaims }) => `/* Account */ ${short(accountClaims)}
/* -> User */ ${short(claims)}
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

export default class Results extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { result, code, onCodeUpdate } = this.props;

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
        : _.map(
            _.keys(userTraits.map(u => u.userTraits)),
            k => `traits_${k}`
          ) || [];
    const ActivePane = _.size(errors) ? Errors : Output;

    const output = [
      "// <---------- User Attributes --------->",
      mapTraits(renderUserTraits)(userTraits),
      "// <---------- Account Attributes --------->",
      mapTraits(renderAccountTraits)(accountTraits),
      "// <---------- User-Account Links --------->",
      mapAccountLinks(accountLinks),
      mapEvents(events)
    ].join("\n");

    return (
      <div>
        <Row className="flexRow result">
          <CodePane
            className="flexColumn codePane"
            onChange={onCodeUpdate}
            value={code}
          />
          <ActivePane
            userTraits={output}
            logs={renderLogs(logs)}
            errors={errors}
            highlight={highlight}
          />
        </Row>
      </div>
    );
  }
}
