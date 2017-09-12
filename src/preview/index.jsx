import React, { Component } from "react";
import { Col } from "react-bootstrap";
import _ from "lodash";

import ResultsPane from "./results";

export default class PreviewPane extends Component {
  render() {
    const { result, onCodeUpdate, code, currentWebhook, md, sm, lg, xs, loading } = this.props;
    const previousResult = _.get(currentWebhook, "result", {});
    const previousCode = _.get(previousResult, "code", "");

    return (<Col className="flexColumn pl-1 resultPane" md={md} sm={sm} lg={lg} xs={xs}>
      <ResultsPane
        title="Previous"
        result={previousResult}
        code={previousCode}
      />
      <ResultsPane
        title="Current"
        result={result}
        code={code}
        loading={loading}
        onCodeUpdate={onCodeUpdate}
      />
    </Col>);
  }
}
