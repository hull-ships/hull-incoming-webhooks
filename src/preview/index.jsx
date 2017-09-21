import React, { Component } from "react";
import { Col, Tabs, Tab } from "react-bootstrap";
import _ from "lodash";

import ResultsPane from "./results";

export default class PreviewPane extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: "Current"
    }
  }

  changeTab = eventKey => {
    this.setState({ activeTab: eventKey });
  };

  currentOrPrevious(current, previous) {
    return this.state.activeTab === "Current" ? current : previous
  }

  render() {
    const { result, onCodeUpdate, code, currentWebhook, md, sm, lg, xs, computing } = this.props;
    const previousResult = _.get(currentWebhook, "result", {});
    const previousCode = _.get(previousResult, "code", "");

    return (<Col className="flexColumn pl-1 resultPane" md={md} sm={sm} lg={lg} xs={xs}>
      <Tabs justified defaultActiveKey={this.state.activeTab} id="preview-tabs" onSelect={this.changeTab}>
        <Tab eventKey="Current" title="Current"/>
        <Tab eventKey="Previous" title="Previous"/>
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
