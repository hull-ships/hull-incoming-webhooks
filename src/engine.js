import _ from "lodash";
import { EventEmitter } from "events";
import superagent from "superagent";

const EVENT = "CHANGE";

export default class Engine extends EventEmitter {

  constructor(config, { ship }) {
    super();
    this.config = config;
    this.state = { ship, loading: false };
    this.compute = _.debounce(this.compute, 1000);
    this.updateParent = _.debounce(this.updateParent, 1000);
  }

  setState(userTraits) {
    this.state = { ...this.state, ...userTraits };
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

  updateShip(ship) {
    this.compute({ ship, webhook: this.state.currentWebhook || {} });
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
      webhook: this.state.currentWebhook
    });
  }

  setLastWebhook(webhook) {
    this.setState({ currentWebhook: webhook });
    this.compute({
      webhook: this.state.currentWebhook
    });
  }

  compute(params) {
    if (this.state.loading) return false;
    this.setState({ loading: true });

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
              loading: false,
              initialized: true
            });
          } else {
            const { ship, lastWebhooks, result } = body || {};

            // Don't kill user code
            if (this && this.state && this.state.ship && this.state.ship.private_settings) {
              ship.private_settings.code = this.state.ship.private_settings.code;
            }

            this.setState({
              loading: false,
              initialized: true,
              error: null,
              ship, lastWebhooks, result
            });
          }
        } catch (err) {
          this.computing = false;
          this.setState({ loading: false, error: err });
        }
      });
    return this.computing;
  }

}
