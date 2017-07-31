/* global Hull */
import { queryParams } from "./utils";
import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import Engine from "./engine";


(function main() {
  const { ship, organization, secret } = queryParams();

  Hull.init({
    appId: ship,
    orgUrl: `https://${organization}`
  });

  Hull.ready((hull, currentUser, app) => {
    const root = document.getElementById("app");
    const engine = new Engine({ ship, organization, secret }, { ship: app, currentUser });

    engine.updateShip(ship);

    ReactDOM.render(<App engine={engine} />, root);
  });
}());
