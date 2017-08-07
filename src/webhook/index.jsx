import React, { Component } from "react";
import { Col, DropdownButton, MenuItem } from "react-bootstrap";
import _ from "lodash";

import Area from "../ui/area";
import Header from '../ui/header';

export default class WebhookPane extends Component {
  getCurrentWebhook(webhooks, currentWebhook) {
    if (currentWebhook) {
      return _.find(webhooks, webhook => _.isEqual(webhook.webhookData, currentWebhook));
    }
    return _.get(webhooks, "[0]", {});
  }

  getTitle(webhooks, currentWebhook) {
    if (!_.size(webhooks)) {
      return "no webhooks received";
    }
    return _.get(this.getCurrentWebhook(webhooks, currentWebhook), "date", "no date provided");
  }

  getWebhookData(webhooks, currentWebhook) {
    return _.get(this.getCurrentWebhook(webhooks, currentWebhook), "webhookData", {});
  }

  render() {
    const { className, sm, md, onChange, lastWebhooks, currentWebhook } = this.props;
    const title = "Last Received Webhooks";

    const lastReceivedWebhooks = lastWebhooks.reverse();
    const webhooksToDisplay = lastReceivedWebhooks.map(webhook => <MenuItem eventKey={webhook.date}>{webhook.date}</MenuItem>);

    return <Col className={className} md={md} sm={sm}>
      <Header title={title}>
        <DropdownButton
          bsSize="small"
          title={this.getTitle(lastReceivedWebhooks, currentWebhook)}
          disabled={_.size(lastWebhooks) === 0}
          id="last-webhook"
          onSelect={onChange} >
          {webhooksToDisplay}
        </DropdownButton>
      </Header>
      <hr/>
      <Area value={this.getWebhookData(lastReceivedWebhooks, currentWebhook)} type="info" onChange={onChange} javascript={false}/>
    </Col>;
  }
}
