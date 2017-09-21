import React, { Component } from "react";
import { Grid, Row } from "react-bootstrap";
import _ from "lodash";

import Help from "./ui/help";
import WebhookUrl from "./ui/webhook-url";
import webhookUrlContent from "./ui/webhook-url-content";
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
    const { lastWebhooks, currentWebhook, initialized, hostname, token, computing, error, ship = {}, result } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;
    const codeIsEmpty = code === "return {};" || code === "";

    if (initialized && token && hostname && lastWebhooks && currentWebhook) {
      return (_.get(lastWebhooks, "length", 0) > 0) ?
        (<div>
          <Grid className="pt-1">
            <Row className="flexRow help-buttons">
              <WebhookUrl ship={ship} token={token} hostname={hostname} className="text-right" showModal={false}/>
              <Help className="text-right" showModal={codeIsEmpty}/>
            </Row>
            <Row className="flexRow">
              <Payload
                className="flexColumn payloadPane"
                currentWebhook={currentWebhook}
                lastWebhooks={lastWebhooks}
                onSelect={this.handleWebhookChange.bind(this)}
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
                error={error}
                computing={computing}
                onCodeUpdate={this.handleCodeUpdate.bind(this)}
                code={code}
                currentWebhook={currentWebhook}
              />
            </Row>
          </Grid>
        </div>) : (webhookUrlContent(hostname, ship.id, token, "webhook-url", "Connector exposes webhook endpoint that you should use within your app to connect with Hull.","Send some requests for preview"))
    }

    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
