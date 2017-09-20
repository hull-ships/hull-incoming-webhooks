import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";
import webhookUrlContent from "./webhook-url-content";

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
    return (<div>
      <Button bsStyle="warning" bsSize="sm" className='btn-pill btn-rounded' onClick={this.open.bind(this)}> YourWebhook Url </Button>

      <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
        <Modal.Body>
          {webhookUrlContent("localhost", "234", "567")}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close.bind(this)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>);
  }
}
