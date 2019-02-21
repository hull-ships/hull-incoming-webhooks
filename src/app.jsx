/* eslint no-unused-vars:0, no-useless-constructor:0, import/no-unresolved:0 */
import React, { Component } from "react";
import { Grid, Row, Modal } from "react-bootstrap";
import _ from "lodash";

import InputSelect from "./ui/webhook-url-content";
import Payload from "./payload";
import Preview from "./preview";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    this.props.engine.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    this.props.engine.removeChangeListener(this._onChange);
  }

  _onChange = () => {
    const state = this.props.engine.getState();
    this.setState(state);
  };

  handleCodeUpdate(code) {
    this.props.engine.updateCode(code);
  }

  handleRefresh() {
    this.props.engine.fetchLastWebhooks();
  }

  handleWebhookChange(date) {
    this.props.engine.setLastWebhook(
      _.find(this.state.lastWebhooks, webhook => webhook.date === date)
    );
  }

  renderSetupMessage() {
    const {
      lastWebhooks,
      currentWebhook,
      loadingWebhooks,
      initialized,
      hostname,
      token,
      computing,
      error,
      ship = {},
      result
    } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;

    return (
      <InputSelect
        show={_.get(lastWebhooks, "length", 0) === 0}
        host={hostname}
        connectorId={ship.id}
        token={token}
        content="We haven't received data from the outside yet. Copy the URL below and configure your external service to POST a valid JSON-formatted payload to it."
        footer="You need to refresh the page after you have sent your webhook to unlock the workspace"
      />
    );
  }

  render() {
    const {
      lastWebhooks,
      currentWebhook,
      loadingWebhooks,
      initialized,
      hostname,
      token,
      computing,
      error,
      ship = {},
      result
    } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;

    if (initialized && token && hostname && lastWebhooks && currentWebhook) {
      return (
        <div>
          {this.renderSetupMessage()}
          <Grid fluid className="pt-05 pb-05 main-container">
            <Row className="flexRow">
              <Payload
                className="flexColumn payloadPane"
                currentWebhook={currentWebhook}
                loadingWebhooks={loadingWebhooks}
                lastWebhooks={lastWebhooks}
                onSelect={this.handleWebhookChange.bind(this)}
                onRefresh={this.handleRefresh.bind(this)}
                sm={4}
                md={4}
                lg={4}
                xs={4}
              />

              <Preview
                sm={8}
                md={8}
                lg={8}
                xs={8}
                result={result}
                ship={ship}
                token={token}
                hostname={hostname}
                error={error}
                computing={computing}
                onCodeUpdate={this.handleCodeUpdate.bind(this)}
                code={code}
                currentWebhook={currentWebhook}
              />
            </Row>
          </Grid>
        </div>
      );
    }

    return (
      <div className="text-center pt-2">
        <h4>Loading...</h4>
      </div>
    );
  }
}
