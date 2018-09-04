// @flow
import type { THullReqContext, THullUserUpdateMessage } from "hull";

class SyncAgent {
  init: boolean;

  constructor(ctx: THullReqContext) {
    this.init = ctx !== undefined;
  }

  sendUserUpdateMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    return Promise.resolve(messages);
  }
}

module.exports = SyncAgent;
