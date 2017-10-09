import React, { Component } from "react";
import { Col, DropdownButton, MenuItem, Button, Label } from "react-bootstrap";
import _ from "lodash";
import Icon from "../ui/icon";
import Area from "../ui/area";

import Header from "../ui/header";

const LABELS = {
  post: "success",
  get: "info",
  delete: "danger",
  put: "warning"
};

const WebhookTitle = ({ webhook, showDate = false }) => (!webhook ? "No Webhook received" : <span>
  <Label bsStyle={LABELS[_.get(webhook, "webhookData.method", "").toLowerCase()]} style={{ marginRight: 5 }}>{_.get(webhook, "webhookData.method")}</Label>
  {_.get(webhook, "webhookData.headers.user-agent")}
  { showDate ? <small style={{ display: "block" }}>{webhook.date}</small> : null }
</span>);

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
      id={`last-webhook-${idx}`} eventKey={webhook.date} style={{ textAlign: "left" }}><WebhookTitle webhook={webhook} showDate/></MenuItem>);

    return <Col className={className} md={md} sm={sm} lg={lg} xs={xs}>
      <Header title="Last 100 webhooks">
        <Button bsClass="btn refresh-button" bsStyle="link" onClick={onRefresh}><Icon name={this.getIcon()}/></Button>
        <DropdownButton
          className="last-webhooks-button" bsStyle="default"
          id="last-webhooks" title={<WebhookTitle webhook={currentWebhook}/>}
          key={_.get(currentWebhook, "date")} onSelect={onSelect}>
          {lastWebhooksButtonConent}
        </DropdownButton>
      </Header>
      <hr className="payload-divider"/>
      <Area value={_.get(currentWebhook, "webhookData", {})} type="info" javascript={false}/>
    </Col>;
  }
}
