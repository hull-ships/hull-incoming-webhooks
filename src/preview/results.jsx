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

  mergeObjects(obj) {
    return _.reduce(obj, (x,y) => {
      return _.merge(x, y);
    });
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

    const mergedUserTraits = [];

    // Merge all traits by user
    userTraits.forEach(v => {
      if (_.filter(mergedUserTraits, alreadyFiltered => _.isEqual(v.userIdentity, alreadyFiltered.userIdentity)).length === 0) {
        const allUserTraits = _.filter(userTraits, x => _.isEqual(x.userIdentity, v.userIdentity));
        mergedUserTraits.push({
          userIdentity: v.userIdentity,
          userTraits: _.reduce(allUserTraits.map(z => z.userTraits), (acc, obj) => _.merge(acc, obj), {})
        });
      }
    });


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
      const traits = mergedUserTraits.map(u => {
        const account = _.find(accountLinks, a => _.isEqual(a.userIdentity, u.userIdentity));
        return `
// User identified by:
${JSON.stringify(u.userIdentity, null, 2)}
// Attributes
${JSON.stringify(u.userTraits, null, 2)}
${account ? `Linked to account identified by: \n${JSON.stringify(account, null, 2)}` : ""}
      `
      });
      // const traits = JSON.stringify(userTraits, null, 2);
      output = `/* TRAITS */
${traits}
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
        const props = JSON.stringify(e.event.properties, null, 2);
        const context = JSON.stringify(e.event.context, null, 2);
        return `Identity:
${identity}
Event:
// Name:
${e.event.eventName}
// Properties
${props}
// Context
${context}
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
