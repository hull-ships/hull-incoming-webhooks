// @flow

import _ from "lodash";
import axios from "axios";
import updateParent from "./lib/update-parent";
import type {
  EngineState,
  Config,
  ConfResponse,
  Entry,
  Result,
  PreviewRequest
} from "../../types";

type Axios<T> = {
  data: T,
  status: number
};
type AxiosComputeResult = Axios<Result>;
type AxiosConfResponse = Axios<ConfResponse>;
type AxiosRecentResponse = Axios<Array<Entry>>;
type AnyFunction = any => any;

const EventEmitter = require("events");

const noop = () => {};
const EVENT = "CHANGE";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*"
};

const DEFAULT_STATE = {
  loadingRecent: false,
  loadingToken: false,
  computing: false,
  initialized: false,
  code: "",
  recent: []
};

export default class Engine extends EventEmitter {
  state: EngineState;

  config: Config;

  computingState: any;

  constructor(config: Config) {
    super();
    this.setState({ ...DEFAULT_STATE, config });
  }

  setState = (newState: { ...EngineState }, callback: AnyFunction = noop) => {
    this.state = { ...this.state, ...newState };
    this.emitChange();
    return callback();
  };

  getState = () => this.state;

  emitChange = () => this.emit(EVENT);

  addChangeListener = (listener: AnyFunction) =>
    this.addListener(EVENT, listener);

  removeChangeListener = (listener: AnyFunction) =>
    this.removeListener(EVENT, listener);

  setup() {
    this.fetchToken();
    this.fetchRecent(() => {
      const { recent } = this.state;
      return this.selectEntry(_.head(recent));
    });
  }

  updateParent = (code: string) => updateParent({ private_settings: { code } });

  updateCode = (code: string) => {
    const { current } = this.state;
    if (!current) return;
    const { payload } = current;
    this.updateParent(code);
    this.setState({ code });
    this.compute({ code, payload });
  };

  selectEntry = (current: Entry) => {
    this.setState({ current });
    const { payload } = current;
    return this.compute({ code: this.state.code, payload });
  };

  selectEntryByDate = (date: string) => {
    const { recent } = this.state;
    this.selectEntry(_.find(recent, entry => entry.date === date));
  };

  finishWithSuccess = (state: {}, callback?: AnyFunction) =>
    this.setState({ ...state, loadingRecent: false }, callback);

  request = async (payload: {
    url: string,
    method?: "get" | "post",
    data?: {},
    headers?: {}
  }): Promise<any> => {
    const { config } = this.state;
    if (!config) {
      return Promise.reject(
        new Error("Can't find a proper config, please reload page")
      );
    }
    return axios({ method: "get", params: config, ...payload });
  };

  fetchToken = async () => {
    this.setState({ loadingToken: true });
    try {
      const { data, status }: AxiosConfResponse = await this.request({
        url: "conf",
        method: "get"
      });
      if (status !== 200) {
        throw new Error("Can't load Token");
      }
      this.setState({ ...data, loadingToken: false });
    } catch (err) {
      this.setState({ token: "", hostname: "", loadingToken: false });
    }
  };

  fetchRecent = async (callback?: Function) => {
    this.setState({ loadingRecent: true });
    try {
      const {
        data: recent = [],
        status
      }: AxiosRecentResponse = await this.request({
        url: "last-webhooks",
        headers: CORS_HEADERS
      });
      if (status !== 200) {
        throw new Error("Can't fetch recent webhooks");
      }
      this.setState({ recent, loadingRecent: false }, callback);
    } catch (err) {
      this.setState({
        error: err.toString(),
        loadingRecent: false
      });
    }
    return true;
  };

  compute = _.debounce(async (request: PreviewRequest) => {
    const { computing } = this.state;
    if (computing) {
      return computing;
    }
    this.setState({ computing: true });

    try {
      const { data, status }: AxiosComputeResult = await this.request({
        url: "compute",
        method: "post",
        data: request
      });
      if (status !== 200) {
        throw new Error("Can't compute result");
      }
      this.finishWithSuccess({ result: data, initialized: true });
    } catch (err) {
      this.setState({
        error: err.toString(),
        initialized: true
      });
    }
    return true;
  }, 1000);
}
