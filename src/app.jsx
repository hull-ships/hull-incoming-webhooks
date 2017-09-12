import React, { Component } from "react";
import { Grid, Row } from "react-bootstrap";
import _ from "lodash";

import Help from "./ui/help";
import WebhookPane from "./webhook";
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

  handleWebhookChange(date) {
    this.props.engine.setLastWebhook(_.find(this.state.lastWebhooks, webhook => webhook.date === date));
  }

  render() {
    const { lastWebhooks, currentWebhook, loading, initialized, error, ship = {}, result } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;
    const codeIsEmpty = code === "return {};" || code === "";

    if (initialized) {
      return <div>
        <Grid className="pt-1">
          <Row className="flexRow help">
            <Help className="text-right" showModal={codeIsEmpty}/>
          </Row>
          <Row className="flexRow">
            <WebhookPane
              className="flexColumn webhookPane"
              sm={3}
              md={3}
              lg={3}
              xs={3}
              lastWebhooks={lastWebhooks}
              currentWebhook={currentWebhook}
              onChange={this.handleWebhookChange.bind(this)}
            />

            <Payload
              className="flexColumn payloadPane"
              currentWebhook={currentWebhook}
              sm={3}
              md={3}
              lg={3}
              xs={3}
            />

            <Preview
              sm={6}
              md={6}
              lg={6}
              xs={6}
              result={result}
              error={error}
              loading={loading}
              onCodeUpdate={this.handleCodeUpdate.bind(this)}
              code={code}
              currentWebhook={currentWebhook}
            />
          </Row>
        </Grid>
      </div>
    }
    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
