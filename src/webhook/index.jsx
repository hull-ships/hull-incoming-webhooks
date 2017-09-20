import React, { Component } from "react";
import { Col, Tab, Nav, NavItem } from "react-bootstrap";
import _ from "lodash";

import Icon from "../ui/icon";
import Header from '../ui/header';

export default class WebhookPane extends Component {
  getIcon(success, errors) {
    if (_.get(errors, "length")) {
      return "cross";
    }

    if (success) {
      return "valid"
    }

    return "cross";
  }

  render() {
    const { className, sm, md, lg, xs, onChange, lastWebhooks, currentWebhook } = this.props;

    const sortedWebhooks = _.reverse(_.sortBy(lastWebhooks, ["date"]));
    const webhooksToDisplay = sortedWebhooks.map(webhook => <NavItem eventKey={webhook.date}>{webhook.date} <Icon className="custom-icon last-webhook-icon" name={this.getIcon(_.get(webhook, "result.success"), _.get(webhook, "result.errors"))} /></NavItem>);

    return <Col className={className} md={md} sm={sm} lg={lg} xs={xs}>
      <Header title="Last Received Webhooks">
      </Header>
      <hr/>
      <div className="last-received-webhooks">
        <Tab.Container onSelect={onChange} id="last-received-webhooks" defaultActiveKey={_.get(currentWebhook, "date", _.head(lastWebhooks))}>
          <Nav bsStyle="pills" stacked>
            {webhooksToDisplay}
          </Nav>
        </Tab.Container>
      </div>
    </Col>;
  }
}
