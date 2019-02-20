/* eslint no-unused-vars:0, no-useless-constructor:0, import/no-unresolved:0 */
import React, { Component } from "react";
import { Grid, Row } from "react-bootstrap";
import _ from "lodash";

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

  handleRefresh() {
    this.props.engine.fetchLastWebhooks();
  }

  handleWebhookChange(date) {
    this.props.engine.setLastWebhook(_.find(this.state.lastWebhooks, webhook => webhook.date === date));
  }

  render() {
    const { lastWebhooks, currentWebhook, loadingWebhooks, initialized, hostname, token, computing, error, ship = {}, result } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;

    if (initialized && token && hostname && lastWebhooks && currentWebhook) {
      return (_.get(lastWebhooks, "length", 0) > 0) ?
        (<div>
          <Grid fluid className="pt-05 pb-05 main-container" >
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
        </div>) : (webhookUrlContent(hostname, ship.id, token, "webhook-url", "Start by sending data to Hull...", "As soon as you send your first payload, you can start hacking."));
    }

    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
