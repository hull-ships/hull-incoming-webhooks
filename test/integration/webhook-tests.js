/* global describe, it, beforeEach, afterEach */

import Minihull from "minihull";
import assert from "assert";
import axios from "axios";
import bootstrap from "./support/bootstrap";
import jwt from "jwt-simple";

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {

  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubConnector({ id: "123456789012345678901234", private_settings });
    minihull.stubSegments([{
      name: "testSegment",
      id: "hullSegmentId"
    }]);

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  const config = {
    organization: "localhost:8001",
    ship: "123456789012345678901234",
    secret: "1234"
  };
  const token = jwt.encode(config, "1234");



});