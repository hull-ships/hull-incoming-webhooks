/* global Hull */
import { queryParams } from "./ui/utils";
import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import Engine from "./ui/engine";

const { ship, organization, secret } = queryParams();
const root = document.getElementById("app");
const engine = new Engine({ ship, organization, secret });
engine.setup();
ReactDOM.render(<App engine={engine} />, root);

if (module.hot && root) {
  module.hot.accept("./app", () => {
    ReactDOM.render(<App />, root);
  });
}
