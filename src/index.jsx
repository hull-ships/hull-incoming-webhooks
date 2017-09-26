/* global Hull */
import { queryParams } from "./utils";
import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import Engine from "./engine";
import ready from "domready";

ready(() => {
  const { ship, organization, secret } = queryParams();
  const root = document.getElementById("app");
  const engine = new Engine({ ship, organization, secret });
  engine.setup();
  ReactDOM.render(<App engine={engine} />, root);
});
