import React, { Component } from "react";
import _ from "lodash";
import { Row } from "react-bootstrap";
import Icon from "../ui/icon";

import CodePane from "../code";
import Errors from "./errors";
import Output from "./output";

export default class Results extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getIcon() {
    if (this.props.title === "Current") {
      if (this.props.loading) {
        return "spinner";
      }
    }

    if (_.get(this.props.result, "errors.length")) {
      return "cross";
    }

    if (_.get(this.props.result, "success")) {
      return "valid"
    }

    return "cross";
  }

  render() {
    const {
      userTraits = [],
      errors = [],
      events = [],
      accountTraits = [],
      accountLinks = [],
      logs = [],
    } = this.props.result;

    const { code, onCodeUpdate } = this.props;

    const highlight = ((errors && errors.length && !_.isEmpty(userTraits)) ? [] : _.map(_.keys(userTraits.map(u => u.userTraits)), k => `traits_${k}`) || []);
    const ActivePane = (errors && errors.length) ? Errors : Output;

    const logOutput = logs.map(l => {
      return l.map(e => {
        return (typeof e === "string") ? e : JSON.stringify(e, null, 2);
      }).join(", ");
    }).join("\n");

    let output = "";
    if (_.size(userTraits) || _.size(accountLinks)) {
      const traits = userTraits.map(user => {
        const account = _.get(_.find(accountLinks, acc => _.isEqual(acc.userIdentity, user.userIdentity)), "accountIdentity");
        return `
// User identified by
${JSON.stringify(user.userIdentity, null, 2)}
// Attributes
${JSON.stringify(user.userTraits || {}, null, 2)}
${account ? `// Linked to account identified by:
${JSON.stringify(account, null, 2)}` : ""}`
      });

      const links = accountLinks.filter(acc => {
        return !_.some(userTraits, user =>
          _.isEqual(user.userIdentity, acc.userIdentity));
      }).map(account => `
// User identified by
${JSON.stringify(account.userIdentity, null, 2)}
// Linked to account identified by
${JSON.stringify(account.accountIdentity, null, 2)}`);

      output = `/* USER TRAITS AND LINKS */
${traits}
${links}
`;
    }
    if (_.size(accountTraits)) {
      const traits = JSON.stringify(accountTraits, null, 2);
      output = `${output}
/* ACCOUNT TRAITS */
${traits}
`;
    }
    if (events.length) {
      const eventString = _.map(events, e => {
        const identity = JSON.stringify((e.userIdentity || e.accountIdentity), null, 2);
        return `${e.userIdentity ? "User " : e.accountIdentity ? "Account " : ""}Identity:
${identity}
Event:
// Name
${e.event.eventName}
${!_.isEmpty(e.event.properties) ? `// Properties
${JSON.stringify(e.event.properties, null, 2)}` : ""}
${!_.isEmpty(e.event.context) ? `// Context
${JSON.stringify(e.event.context, null, 2)}` : ""}
`; });
      output = (`${output}
/* EVENTS */
${eventString}`).split(",").join("");
    }

    return (<div>
      <div className="flexRow">
        <Icon className="custom-icon" name={this.getIcon()} />
      </div>

      <Row className="flexRow result">
        <CodePane
          className="flexColumn codePane"
          onChange={onCodeUpdate}
          value={code}
        />
        <ActivePane
          userTraits={output}
          logs={logOutput}
          errors={errors}
          highlight={highlight}
        />
      </Row>
    </div>);
  }
}
