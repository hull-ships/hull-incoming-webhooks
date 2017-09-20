import React, { Component } from "react";
import { Col, DropdownButton, MenuItem } from "react-bootstrap";
import _ from "lodash";
import Area from '../ui/area';

import Header from '../ui/header';

export default class PayloadPane extends Component {
  render() {
    const { className, sm, md, lg, xs, currentWebhook, lastWebhooks, onSelect } = this.props;
    const lastWebhooksButtonConent = _.reverse(_.sortBy(lastWebhooks, ["date"])).map((webhook, idx) => <MenuItem
      id={`last-webhook-${idx}`} eventKey={webhook.date}>{webhook.date}</MenuItem>);

    return <Col className={className} md={md} sm={sm} lg={lg} xs={xs}>
      <Header title="Payload">
        <DropdownButton
          disabled={_.get(lastWebhooks, "length", 0) === 0} className="last-webhooks-button" bsStyle="default"
          bsSize="small" id="last-webhooks" title={_.get(currentWebhook, "date", "No Webhooks Received")}
          key={_.get(currentWebhook, "date")} onSelect={onSelect}>
          {lastWebhooksButtonConent}
        </DropdownButton>
      </Header>
      <hr/>
      <Area value={_.get(currentWebhook, "webhookData", {})} type="info" javascript={false}/>
    </Col>;
  }
}
