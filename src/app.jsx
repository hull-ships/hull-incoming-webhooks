import React, { Component } from "react";
import { Grid, Row } from "react-bootstrap";
import _ from "lodash";

import UserPane from "./webhook";
import CodePane from "./code";
import ResultsPane from "./results";

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
    this.props.engine.setLastWebhook(_.get(_.find(this.state.lastWebhooks, webhook => webhook.date === date), "webhookData"));
  }

  render() {
    const { lastWebhooks, currentWebhook, loading, initialized, error, ship = {} } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;
    if (initialized) {
      return <div>
        <Grid fluid={true} className="pt-1">
          <Row className="flexRow">
            <UserPane
              className="flexColumn userPane"
              sm={4}
              md={4}
              lastWebhooks={lastWebhooks}
              currentWebhook={currentWebhook}
              onChange={this.handleWebhookChange.bind(this)}/>
            <CodePane
              className="flexColumn userPane"
              onChange={this.handleCodeUpdate.bind(this)}
              value={code}
              sm={4}
              md={5}
            />
            <ResultsPane
              className="flexColumn pl-1 resultPane"
              sm={4}
              md={3}
              loading={loading}
              error={error}
              {...this.state.result} />
          </Row>
        </Grid>
      </div>
    }
    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
