import React, { Component } from "react";
import { Col } from "react-bootstrap";
import _ from "lodash";
import Area from '../ui/area';

import Header from '../ui/header';

export default class PayloadPane extends Component {
  render() {
    const { className, sm, md, lg, xs, currentWebhook } = this.props;

    return <Col className={className} md={md} sm={sm} lg={lg} xs={xs}>
      <Header title="Payload">
      </Header>
      <hr/>
      <Area value={_.get(currentWebhook, "webhookData", {})} type="info" javascript={false}/>
    </Col>;
  }
}
