import _ from "lodash";
import { EventEmitter } from "events";
import superagent from "superagent";

const EVENT = "CHANGE";

export default class Engine extends EventEmitter {
  constructor(config, { ship }) {
    super();
    this.config = config;
    this.state = { ship };
    this.compute = _.debounce(this.compute, 1000);
    this.updateParent = _.debounce(this.updateParent, 1000);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.emitChange();
    return this.state;
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

  setupShip(ship) {
    this.compute({ ship, webhook: _.get(this.state.currentWebhook, "webhookData", {}) });
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

  compute(params) {
    this.setState({
      loading: true
    });
    if (this.computing) {
      this.computing.abort();
    }
    this.computing = superagent.post("/compute")
      .query(this.config)
      .send(params)
      .accept("json")
      .end((error, { body = {}, status } = {}) => {
        try {
          this.computing = false;
          if (error) {
            this.setState({
              error: { ...body, status },
              initialized: true
            });
          } else {
            const { ship, lastWebhooks, result } = body || {};

            // Don't kill user code
            if (this && this.state && this.state.ship && this.state.ship.private_settings) {
              ship.private_settings.code = this.state.ship.private_settings.code;
            }

            if (this.state.lastWebhooks) {
              this.setState({
                initialized: true,
                dashboardReady: true
              })
            }

            this.setState({
              error: null,
              ship, lastWebhooks, result, fetchedWebhooks: true, loading: false
            });

            if (this.state.fetchedWebhooks && !this.state.dashboardReady) {
              this.state.currentWebhook = _.last(this.state.lastWebhooks);
              this.setupShip(this.state.ship);
            }
          }
        } catch (err) {
          this.computing = false;
          this.setState({ error: err });
        }
      });
    return this.computing;
  }
}
