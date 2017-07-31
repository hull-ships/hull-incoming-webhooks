import { Connector } from "hull";
import express from "express";

import server from "../../../server/server";
import { Cache } from "hull/lib/infra";

export default function bootstrap() {
  const cache = new Cache({
    store: "memory",
    ttl: 1
  });

  const options = {
    hostSecret: "1234",
    port: 8000,
    cache,
    clientConfig: { protocol: "http", firehoseUrl: "firehose" }
  };

  let app = express();
  const connector = new Connector(options);
  connector.setupApp(app);
  app = server(connector, options, app);
  return connector.startApp(app);
}
