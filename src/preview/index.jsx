import React, { Component } from "react";
import { Col, Tabs, Tab } from "react-bootstrap";
import _ from "lodash";

import Icon from "../ui/icon";
import Help from "../ui/help";
import WebhookUrl from "../ui/webhook-url";
import ResultsPane from "./results";

export default class PreviewPane extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: "Current"
    }
  }

  getIcon() {
    if (this.state.activeTab === "Current") {
      if (this.props.computing) {
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

  changeTab = eventKey => {
    this.setState({ activeTab: eventKey });
  };

  currentOrPrevious(current, previous) {
    return this.state.activeTab === "Current" ? current : previous
  }

  render() {
    const { result, onCodeUpdate, code, currentWebhook, md, sm, lg, xs, computing, ship, token, hostname } = this.props;
    const previousResult = _.get(currentWebhook, "result", {});
    const previousCode = _.get(previousResult, "code", "");

    return (<Col className="flexColumn pl-1 resultPane" md={md} sm={sm} lg={lg} xs={xs}>
      <Tabs justified defaultActiveKey={this.state.activeTab} id="preview-tabs" onSelect={this.changeTab}>
        <Tab eventKey="Current" title={<div>
          <div className="tab-title">Current</div>
          <Icon className="custom-icon status-icon" name={this.getIcon()}/>
        </div>
        }/>
        <Tab eventKey="Previous" title={<div>
          <div className="tab-title">Previous</div>

          <WebhookUrl ship={ship} token={token} hostname={hostname} className="text-right"/>
          <Help className="text-right"/>

        </div>}>

        </Tab>
      </Tabs>

      <ResultsPane
        title={this.state.activeTab}
        result={this.currentOrPrevious(result, previousResult)}
        code={this.currentOrPrevious(code, previousCode)}
        computing={computing}
        onCodeUpdate={this.currentOrPrevious(onCodeUpdate, undefined)}
      />
    </Col>);
  }
}
