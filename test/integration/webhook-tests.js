/* global describe, it, beforeEach, afterEach */

const Minihull = require("minihull");
const axios = require("axios");
const assert = require("assert");
const _ = require("lodash");

const { encrypt } = require("../../server/lib/crypto");
const bootstrap = require("./support/bootstrap");

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {
    // eslint-disable-next-line no-multi-str
    code: "hull.user({ \"id\": body.user.id }).traits(body.user.traits);\n\
    hull.user({ \"id\": body.user.id }).track(body.user.eventName);"
  };

  beforeEach(done => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubAccountsSegments([]);
    minihull.stubConnector({ id: "123456789012345678901234", private_settings });

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
  const token = encrypt(config, "1234");

  it("should update user when webhook is sent", done => {
    minihull.on("incoming.request", req => {

      if( req.url !== '/api/v1/firehose' )
        return

      const batch = req.body.batch;
      let firstCheck = false;
      let secondCheck = false;

      batch.forEach(incoming => {
        if (incoming.type === "traits") {
          assert.equal(_.get(incoming.body, "customerioid"), "321");
          firstCheck = true;
        } else {
          assert.equal(incoming.body.event, "test");
          secondCheck = true;
        }
      });

      if (!firstCheck) {
        done(Error("first check not satisfied"));
      } else if (!secondCheck) {
        done(Error("second check not satisfied"));
      } else {
        done();
      }
    });

    axios.post(`http://localhost:8000/webhooks/123456789012345678901234/${token}`, {
      user: {
        id: "123",
        eventName: "test",
        traits: {
          customerioid: "321"
        }
      }
    });
  });
});
