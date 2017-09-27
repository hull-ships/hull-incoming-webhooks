import React, { Component } from "react";
import { Col, DropdownButton, MenuItem, Button } from "react-bootstrap";
import _ from "lodash";

import Area from '../ui/area';
import Icon from "../ui/icon";
import Header from '../ui/header';

export default class PayloadPane extends Component {
  constructor() {
    super();
  }

  getIcon() {
    if (this.props.loadingWebhooks) {
      return "spinner";
    }
    return "reset";
  }

  render() {
    const { className, sm, md, lg, xs, currentWebhook, lastWebhooks, onSelect, onRefresh } = this.props;
    const lastWebhooksButtonConent = _.reverse(_.sortBy(lastWebhooks, ["date"])).map((webhook, idx) => <MenuItem
      id={`last-webhook-${idx}`} eventKey={webhook.date}>{webhook.date}</MenuItem>);

    return <Col className={className} md={md} sm={sm} lg={lg} xs={xs}>
      <Header title="Payload">
        <Button bsClass="btn refresh-button" bsStyle="link" onClick={onRefresh}><Icon name={this.getIcon()}/></Button>
        <DropdownButton
          className="last-webhooks-button" bsStyle="default"
          bsSize="small" id="last-webhooks" title={_.get(currentWebhook, "date", "No Webhooks Received")}
          key={_.get(currentWebhook, "date")} onSelect={onSelect}>
          {lastWebhooksButtonConent}
        </DropdownButton>
      </Header>
      <hr className="payload-divider"/>
      <Area value={_.get(currentWebhook, "webhookData", {})} type="info" javascript={false}/>
    </Col>;
  }
}
