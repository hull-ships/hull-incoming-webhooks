import _ from "lodash";
import { EventEmitter } from "events";
import axios from "axios";

const EVENT = "CHANGE";

export default class Engine extends EventEmitter {
  constructor(config, { ship }) {
    super();
    this.config = config;
    this.state = { ship, API_PREFIX: ship.source_url.endsWith("/") ? _.trimEnd(ship.source_url, "/") : ship.source_url };
    this.compute = _.debounce(this.compute, 1000);
    this.updateParent = _.debounce(this.updateParent, 1000);
  }

  setState(newState, callback = () => {}) {
    this.state = { ...this.state, ...newState };
    this.emitChange();
    return callback();
  }

  getState() {
    return this.state || {};
  }

  addChangeListener(listener) {
    this.addListener(EVENT, listener);
  }

  removeChangeListener(listener) {
    this.removeListener(EVENT, listener);
  }

  emitChange() {
    this.emit(EVENT);
  }

  setup(ship) {
    this.fetchToken();
    this.fetchLastWebhooks(() => {
      return this.setState({
        currentWebhook: _.head(this.state.lastWebhooks) || {}
      }, () => this.compute({ ship, webhook: _.get(this.state.currentWebhook, "webhookData", {}) }))
    });
  }

  updateParent(code) {
    if (window.parent) {
      window.parent.postMessage(JSON.stringify({
        from: "embedded-ship",
        action: "update",
        ship: { private_settings: { code } }
      }), "*");
    }
  }

  updateCode(code) {
    const { ship } = this.state || {};
    if (!ship || !ship.id) return;
    const newShip = {
      ...ship,
      private_settings: {
        ...ship.private_settings,
        code
      }
    };
    this.updateParent(code);
    this.setState({ ship: newShip });
    this.compute({
      ship: newShip,
      webhook: _.get(this.state.currentWebhook, "webhookData", {})
    });
  }

  setLastWebhook(webhook) {
    this.setState({ currentWebhook: webhook });
    this.compute({
      code: _.get(this.state, "ship.private_settings.code"),
      webhook: _.get(this.state.currentWebhook, "webhookData", {})
    });
  }

  fetchToken() {
    this.setState({
      loadingToken: true
    });

    return axios.get(`${this.state.API_PREFIX}/conf`, {
      params: this.config
    }).then(({ data = {}, status }) => {
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
        })
      }
    })
  }

  fetchLastWebhooks(callback) {
    this.setState({
      loadingWebhooks: true
    });

    return axios.get(`${this.state.API_PREFIX}/last-webhooks`, {
      params: this.config,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    })
      .then(({ data = {}, status }) => {
        try {
          const { lastWebhooks } = data;
          this.setState({
            lastWebhooks,
            loadingWebhooks: false
          }, callback);
        } catch (err) {
          this.setState({
            loadingWebhooks: false,
            error: {
              ...data,
              status
            }
          })
        }
      })
  }

  compute(dataToSend) {
    this.setState({
      computing: true
    });
    if (this.computingState) {
      return this.computingState;
    }
    this.computingState = axios({
      url: `${this.state.API_PREFIX}/compute`,
      method: "post",
      params: this.config,
      data: dataToSend
    })
      .then(({ data = {}, status } = {}) => {
        try {
          this.computingState = false;
          const { ship, result } = data || {};

          // Don't kill user code
          if (this && this.state && this.state.ship && this.state.ship.private_settings) {
            ship.private_settings.code = this.state.ship.private_settings.code;
          }

          this.setState({ ship, result, computing: false, initialized: true });
        } catch (err) {
          this.computingState = false;
          this.setState({ err, ...data, status, initialized: true, computing: false });
        }
      });
    return this.computingState;
  }
}
