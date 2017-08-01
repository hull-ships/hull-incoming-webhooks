/* global describe, it, beforeEach, afterEach */

import Minihull from "minihull";
import axios from "axios";
import assert from "assert";
import jwt from "jwt-simple";
import bootstrap from "./support/bootstrap";

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {
    code: "hull.asUser({ \"id\": user.id });\nhull.traits(user.traits);\nhull.track(user.eventName);"
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubConnector({ id: "123456789012345678901234", private_settings });
    minihull.stubSegments([]);

    setTimeout(() => {
      done();
    }, 1500);
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

  it("should update user when webhook is sent", (done) => {
    axios.post(`http://localhost:8000/webhooks/123456789012345678901234?token=${token}`, {
      user: {
        id: "123",
        eventName: "test",
        traits: {
          customerioid: "321"
        }
      }
    }).then(() => {
      minihull.on("incoming.request", (req) => {
        const batch = req.body.batch;

        batch.forEach(incoming => {
          if (incoming.type === "traits") {
            assert.equal(incoming.body.customerioid, "321");
          } else {
            assert.equal(event.eventName, "test");
          }
        });
      });
    });

    setTimeout(() => {
      done()
    }, 1500);
  });
});