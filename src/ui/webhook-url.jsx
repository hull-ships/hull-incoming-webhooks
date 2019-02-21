import React, { Component } from "react";
import { Button } from "react-bootstrap";
import InputSelect from "./webhook-url-content";

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

    return (
      <div>
        <Button
          bsClass="btn"
          bsStyle="secondary"
          bsSize="small"
          onClick={this.open.bind(this)}
        >
          Show Webhook Configuration
        </Button>
        <InputSelect
          show={this.state.showModal}
          host={hostname}
          connectorId={ship.id}
          token={token}
          content="Copy the URL below and configure your external service to send a valid JSON-formatted payload to it as a HTTP POST call"
          actions={<Button onClick={this.close.bind(this)}>Close</Button>}
        />
      </div>
    );
  }
}
