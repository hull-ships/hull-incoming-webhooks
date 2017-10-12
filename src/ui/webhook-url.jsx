import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";

import webhookUrlContent from "./webhook-url-content";
import Icon from "./icon";

export default class WebhookUrl extends Component {
  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    const { token, hostname, ship } = this.props;

    return (<div>
      <Button bsClass="btn help-button webhook-url-button" bsStyle="link" onClick={this.open.bind(this)}><Icon className="custom-icon" name="source"/></Button>

      <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
        <Modal.Body>
          {webhookUrlContent(hostname, ship.id, token, "webhook-url-modal")}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close.bind(this)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>);
  }
}
