// @flow
/* global window */

import _ from "lodash";
import axios from "axios";
import type { Webhook, Ship, Result } from "../../types";

const EventEmitter = require("events");

const EVENT = "CHANGE";

type State = {
  computing: boolean,
  initialized: boolean,
  currentWebhook?: Webhook,
  lastWebhooks: Array<Webhook>,
  ship: Ship
};
type Config = {};

export default class Engine extends EventEmitter {
  state = {};

  config: any;

  computingState: any;

  constructor(config: Config) {
    super();
    this.config = config;
  }

  setState = (newState: { ...State }, callback: Function = () => {}) => {
    this.state = { ...this.state, ...newState };
    console.log("Updating State", this.state);
    this.emitChange();
    return callback();
  };

  getState = () => this.state;

  addChangeListener = (listener: Function) => this.addListener(EVENT, listener);

  removeChangeListener = (listener: Function) =>
    this.removeListener(EVENT, listener);

  emitChange = () => this.emit(EVENT);

  setup() {
    this.fetchToken();
    this.fetchLastWebhooks(() => {
      const { lastWebhooks } = this.state;
      this.setState({
        currentWebhook: _.head(lastWebhooks)
      });
      const { currentWebhook } = this.state;
      return this.compute({
        webhook: _.get(currentWebhook, "webhookData", {})
      });
    });
  }

  updateParent = _.debounce(code => {
    if (window.parent) {
      window.parent.postMessage(
        JSON.stringify({
          from: "embedded-ship",
          action: "update",
          ship: { private_settings: { code } }
        }),
        "*"
      );
    }
  }, 1000);

  updateCode = (code: string) => {
    const { ship = {} } = this.state;
    if (!ship.id) return;
    const { private_settings = {} } = ship;
    const newShip = {
      ...ship,
      private_settings: {
        ...private_settings,
        code
      }
    };
    this.updateParent(code);
    this.setState({ ship: newShip }, () => {
      const { currentWebhook } = this.state;
      this.compute({
        ship: newShip,
        webhook: _.get(currentWebhook, "webhookData", {})
      });
    });
  };

  setLastWebhook = (webhook: Webhook) => {
    this.setState({ currentWebhook: webhook });
    this.compute({
      code: _.get(this.state, "ship.private_settings.code"),
      webhook: _.get(this.state.currentWebhook, "webhookData", {})
    });
  };

  fetchToken = () => {
    this.setState({
      loadingToken: true
    });

    return axios
      .get("conf", {
        params: this.config
      })
      .then(({ data = {}, status }) => {
        try {
          const { token, hostname } = data || {};
          this.setState({ token, hostname, loadingToken: false });
        } catch (err) {
          this.setState({
            loadingToken: false,
            error: {
              ...data,
              status
            }
          });
        }
      });
  };

  fetchLastWebhooks = (callback?: Function) => {
    this.setState({
      loadingWebhooks: true
    });

    return axios
      .get("last-webhooks", {
        params: this.config,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      })
      .then(({ data = {}, status }) => {
        try {
          const { lastWebhooks } = data;
          this.setState(
            {
              lastWebhooks,
              loadingWebhooks: false
            },
            callback
          );
        } catch (err) {
          this.setState({
            loadingWebhooks: false,
            error: {
              ...data,
              status
            }
          });
        }
      });
  };

  compute = _.debounce(dataToSend => {
    this.setState({
      computing: true
    });
    if (this.computingState) {
      return this.computingState;
    }
    this.computingState = axios({
      url: "compute",
      method: "post",
      params: this.config,
      data: dataToSend
    }).then(
      ({
        data = {},
        status
      }: {
        data: { ship?: Ship, result?: Result },
        status: string
      } = {}) => {
        const { ship = {} } = this.state;
        const { private_settings = {} } = ship;
        const { code } = private_settings;
        this.computingState = null;
        const { ship: newShip, result } = data;
        try {
          if (newShip && newShip.private_settings) {
            // Don't overwrite user code
            newShip.private_settings.code = code;
          }

          this.setState({
            ship: newShip,
            result,
            computing: false,
            initialized: true
          });
        } catch (err) {
          this.setState({
            err,
            ...data,
            status,
            initialized: true,
            computing: false
          });
        }
      }
    );
    return this.computingState;
  }, 1000);
}
