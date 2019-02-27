/* global describe, it, beforeEach, afterEach */
import Minihull from "minihull";
import axios from "axios";
import assert from "assert";
import _ from "lodash";

import { encrypt } from "../../server/lib/crypto";
import bootstrap from "./support/bootstrap";

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {
    code: "hull.user({ \"id\": body.user.id }).traits(body.user.traits, { source: \"my-group\" });"
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubConnector({ id: "123456789012345678901234", private_settings });
    minihull.stubUsersSegments([]);

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
    let check = false;

    axios.post(`http://localhost:8000/webhooks/123456789012345678901234/${token}`, {
      user: {
        id: "123",
        traits: {
          customerioid: "321"
        }
      }
    }).then(() => {
      minihull.on("incoming.request", req => {
        const batch = req.body.batch[0];

        if (batch.type === "traits") {
          assert.equal(_.get(batch.body, "my-group/customerioid"), "321");
          check = true;
        }
      });

      setTimeout(() => {
        if (!check) {
          done(Error("check not satisfied"));
        } else {
          done();
        }
      }, 1500);
    });
  });
});
