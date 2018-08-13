// @flow

import type { TRequest, THullReqContext } from "hull";

export type TRequestIncomingWebhooksBody = mixed & {
  ship: Object,
};

type THullReqContextIncomingWebhooks = THullReqContext & {
  cachedWebhookPayload: Object,
};

export type TRequestIncomingWebhooks = TRequest & {
  body: TRequestIncomingWebhooksBody,
  hull: THullReqContextIncomingWebhooks,
  url: string,
};

export type TWebhookRequest = {
  mongoUrl: string,
  collectionSize: number,
  collectionName: string,
};
