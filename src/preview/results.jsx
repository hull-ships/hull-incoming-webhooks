import React, { Component } from "react";
import _ from "lodash";
import { Row } from "react-bootstrap";
import Icon from "../ui/icon";

import CodePane from "../code";
import Header from "../ui/header";
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

    return null;
  }

  render() {
    const {
      userTraits = [],
      errors = [],
      events = [],
      accountClaims = [],
      logs = [],
    } = this.props.result;

    const { code, onCodeUpdate, title } = this.props;

    const highlight = ((errors && errors.length && !_.isEmpty(userTraits)) ? [] : _.map(_.keys(userTraits.map(u => u.userTraits)), k => `traits_${k}`) || []);
    const ActivePane = (errors && errors.length) ? Errors : Output;

    const logOutput = logs.map(l => {
      return l.map(e => {
        return (typeof e === "string") ? e : JSON.stringify(e, null, 2);
      }).join(", ");
    }).join("\n");

    let output = "";
    if (_.size(userTraits)) {
      const traits = JSON.stringify(userTraits, null, 2);
      output = `/* TRAITS */
${traits}
`;
    }
    if (_.size(accountClaims)) {
      const claims = JSON.stringify(accountClaims, null, 2);
      output = `${output}
/* ACCOUNT CLAIMS */
${claims}
`;
    }
    if (events.length) {
      const eventString = _.map(events, e => {
        const identity = JSON.stringify((e.userIdentity || e.accountIdentity), null, 2);
        const props = JSON.stringify(e.event.properties, null, 2);
        return `Identity:
${identity}
Event:
(${e.event.eventName} - ${props})

`; });
      output = (`${output}
/* EVENTS */
${eventString}`).split(",").join("");
    }

    return (<div>
      <Header title={title}>
        <Icon className="custom-icon" name={this.getIcon()} />
      </Header>
      <hr/>
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
