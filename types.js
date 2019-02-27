// @flow
export type Claims = {};
export type ClaimsOptions = {};

export type Traits = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  traits: {
    properties: {},
    options: {}
  }
};
export type Links = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  accountClaims: Claims,
  accountClaimsOptions: ClaimsOptions
};

export type Results = {
  userTraits: Array<Traits>,
  accountTraits: Array<Traits>,
  accountLinks: Array<any>,
  errors: Array<any>,
  events: Array<any>,
  logs: Array<any>
};
export type Event = {};

export type Result = {
  accountTraits: Array<Traits>,
  success: boolean,
  accountLinks: Array<Links>,
  events: Array<Event>,
  userTraits: Array<Traits>,
  code: string,
  errors: Array<string>,
  logsForLogger: Array<string>,
  logs: Array<string>
};

export type Webhook = {
  date: string,
  result: Result,
  webhookData: {
    query: {},
    params: {},
    method: string,
    ip: string,
    headers: {},
    body: {}
  }
};

export type Ship = {
  id: string,
  private_settings: {
    code?: string
  }
};
