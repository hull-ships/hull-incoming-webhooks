// @flow
/* eslint no-unused-vars:0, no-useless-constructor:0, import/no-unresolved:0 */
import React, { Component } from "react";
import {
  DropdownButton,
  Tabs,
  Tab,
  ButtonGroup,
  Button
} from "react-bootstrap";
import _ from "lodash";
import type { Ship, Result, Webhook } from "../../types";
import type Engine from "./engine";

import KeyBindings from "./ui/key-bindings";
import ConfigurationModal from "./ui/configuration-modal";
import CodePane from "./code";
import Payload from "./payload";
import Preview from "./preview";
import Header from "./ui/header";
import WebhookHistory from "./ui/webhook-history";
import CodeTitle from "./ui/code-title";

type Props = {
  engine: Engine
};

type State = {
  showWebhookConfig: boolean,
  showBindings: boolean,
  currentWebhook?: Webhook,
  lastWebhooks: Array<Webhook>,
  loadingWebhooks: boolean,
  initialized?: boolean,
  hostname?: string,
  token?: string,
  computing?: boolean,
  error?: any,
  ship?: Ship,
  activeTab: string,
  result?: Result
};

export default class App extends Component<Props, State> {
  state = {
    activeTab: "Current",
    showWebhookConfig: false,
    showBindings: false,
    loadingWebhooks: false,
    lastWebhooks: [],
    currentWebhook: undefined,
    initialized: false,
    hostname: "",
    token: "",
    computing: false,
    ship: undefined,
    result: undefined,
    error: ""
  };

  componentWillMount() {
    const { engine } = this.props;
    engine.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    const { engine } = this.props;
    engine.removeChangeListener(this._onChange);
  }

  _onChange = () => {
    const { engine } = this.props;
    console.log("On Change called", engine.getState());
    this.setState(engine.getState());
  };

  handleChangeCurrent = (date: string) => {
    const { engine } = this.props;
    const { lastWebhooks = [] } = this.state;
    engine.setLastWebhook(
      _.find(lastWebhooks, webhook => webhook.date === date)
    );
  };

  handleCodeUpdate = (code: string) => {
    const { engine } = this.props;
    engine.updateCode(code);
  };

  handleRefresh = () => {
    const { engine } = this.props;
    engine.fetchLastWebhooks();
  };

  hideBindings = () => this.setState({ showBindings: false });

  showBindings = () => this.setState({ showBindings: true });

  hideWebhookConfig = () => this.setState({ showWebhookConfig: false });

  showWebhookConfig = () => this.setState({ showWebhookConfig: true });

  changeTab = (eventKey: string) => {
    this.setState({ activeTab: eventKey });
  };

  currentOrPrevious = (current: any, previous: any) => {
    const { activeTab } = this.state;
    return activeTab === "Current" ? current : previous;
  };

  getCode = () => {
    const { activeTab } = this.state;
    if (activeTab === "Current") {
      return _.get(this.state, "ship.private_settings.code", "");
    }
    return _.get(this.state, "currentWebhook.result.code", "");
  };

  getResults = () => {
    const { activeTab } = this.state;
    if (activeTab === "Current") {
      return _.get(this.state, "result", {});
    }
    return _.get(this.state, "currentWebhook.result", "");
  };

  renderSetupMessage() {
    const { lastWebhooks, hostname, token, ship = {} } = this.state;
    return (
      <ConfigurationModal
        show={_.get(lastWebhooks, "length", 0) === 0}
        host={hostname}
        onHide={() => {}}
        connectorId={ship.id}
        token={token}
        content="We haven't received data from the outside yet. Copy the URL below and configure your external service to POST a valid JSON-formatted payload to it."
        footer="You need to refresh the page after you have sent your webhook to unlock the workspace"
      />
    );
  }

  render() {
    const {
      currentWebhook,
      loadingWebhooks,
      lastWebhooks,
      ship,
      token,
      hostname,
      error,
      computing,
      initialized,
      result,
      activeTab,
      showWebhookConfig,
      showBindings
    } = this.state;
    const { id, private_settings = {} } = ship || {};

    if (initialized && token && hostname) {
      return (
        <div>
          {this.renderSetupMessage()}
          <div className="main-container flexRow">
            <div className="flexColumn flexGrow third">
              <Header title="Recent webhooks">
                <WebhookHistory
                  loading={computing || loadingWebhooks}
                  current={currentWebhook}
                  history={lastWebhooks}
                  onSelect={this.handleChangeCurrent}
                  onRefresh={this.handleRefresh}
                />
                <hr className="payload-divider" />
              </Header>
              <CodeTitle title="Payload" />
              <Payload
                className="payloadPane"
                current={currentWebhook}
                // loading={loadingWebhooks}
                // lastWebhooks={lastWebhooks}
                onSelect={this.handleChangeCurrent}
                onRefresh={this.handleRefresh}
              />
            </div>
            <div className="flexColumn flexGrow third">
              <Header>
                <Tabs
                  justified
                  defaultActiveKey={activeTab}
                  id="preview-tabs"
                  onSelect={this.changeTab}
                >
                  <Tab eventKey="Current" title="Current Code" />
                  <Tab eventKey="Previous" title="At Webhook reception" />
                </Tabs>
              </Header>
              <CodeTitle title="Code" />
              <CodePane
                computing={computing}
                code={this.getCode()}
                editable={activeTab === "Current"}
                currentWebhook={currentWebhook}
                onChange={this.handleCodeUpdate}
              />
            </div>
            <div className="flexColumn flexGrow third">
              <Header>
                <ButtonGroup>
                  <Button
                    bsClass="btn"
                    bsStyle="pill"
                    bsSize="small"
                    onClick={this.showWebhookConfig}
                  >
                    Configuration
                  </Button>
                  <Button
                    bsClass="btn"
                    bsStyle="pill"
                    bsSize="small"
                    onClick={this.showBindings}
                  >
                    Keyboard Shortcuts
                  </Button>
                </ButtonGroup>
                <ConfigurationModal
                  show={showWebhookConfig}
                  host={hostname}
                  connectorId={id}
                  token={token}
                  footer={null}
                  onHide={this.hideWebhookConfig}
                  content="Copy the URL below and configure your external service to send a valid JSON-formatted payload to it as a HTTP POST call"
                  actions={
                    <Button onClick={this.hideWebhookConfig}>Close</Button>
                  }
                />
                <KeyBindings show={showBindings} onHide={this.hideBindings} />
              </Header>

              {result && ship && (
                <Preview
                  title={activeTab}
                  result={this.getResults()}
                  computing={computing}
                />
              )}
            </div>
          </div>
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
