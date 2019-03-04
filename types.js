// @flow

import type {
  Hull,
  HullAccountAttributes,
  HullUserAttributes,
  HullAccountAttributesOptions,
  HullUserAttributesOptions,
  HullConnector,
  HullUserClaims,
  HullUserClaimOptions,
  HullAccountClaims,
  HullAccountClaimsOptions
} from "hull";

export type Claims = HullUserClaims | HullAccountClaims;
export type ClaimsOptions = HullUserClaimOptions | HullAccountClaimsOptions;
export type AccountClaims = HullUserClaims | HullAccountClaims;
export type AccountClaimsOptions =
  | HullUserClaimOptions
  | HullAccountClaimsOptions;
export type Attributes = HullUserAttributes | HullAccountAttributes;
export type AttributesOptions =
  | HullUserAttributesOptions
  | HullAccountAttributesOptions;

export type Ship = {
  id: string,
  private_settings: {
    code?: string
  }
};

export type Traits = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  traits: {
    properties: Attributes,
    options: AttributesOptions
  }
};

export type Links = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  accountClaims: Claims,
  accountClaimsOptions: ClaimsOptions
};

export type Event = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  event: {
    eventName: string,
    properties?: {},
    context?: {}
  }
};

export type Payload = {
  query: {},
  params: {},
  cookies: {},
  method: string,
  ip: string,
  headers: {
    [string]: string
  },
  body: {}
};

export type Result = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Array<Traits>,
  accountTraits: Array<Traits>,
  events: Array<Event>,
  accountLinks: Array<Links>,
  isAsync: boolean,
  success: boolean
};

export type PreviewRequest = {
  payload: Payload,
  code: string
};

export type Entry = {
  connectorId: string,
  code: string,
  payload: Payload,
  result: Result,
  date: string
};

export type ComputeOptions = {
  code: string,
  preview: boolean,
  payload: Payload,
  ship: HullConnector,
  client: Hull
};

type AnyFunction = any => any;

type HullShape = {
  asUser: (
    HullUserClaims,
    HullUserClaimOptions
  ) => {
    traits: HullUserAttributes => void,
    identify: HullUserAttributes => void,
    track: (string, {}) => void
  },
  asAccount: (
    HullAccountClaims,
    HullAccountClaimsOptions
  ) => {
    traits: HullUserAttributes => void,
    identify: HullUserAttributes => void
  }
};

export type Sandbox = {
  moment: AnyFunction,
  urijs: AnyFunction,
  lodash: AnyFunction,
  ship: HullConnector,
  hull?: HullShape,
  responses: Array<any>
};

export type ClaimsPayload = {
  claims: Claims,
  claimsOptions: ClaimsOptions,
  accountClaims?: AccountClaims,
  accountClaimsOptions?: AccountClaimsOptions
};
export type ClaimsSubject = "user" | "account";
export type ClaimsValidation =
  | {
      ...ClaimsPayload,
      valid: true,
      message: void,
      error: void,
      subject: ClaimsSubject
    }
  | {
      ...ClaimsPayload,
      valid: false,
      subject: ClaimsSubject,
      message: string,
      error: string
    };

export type RunOptions = {
  ship: HullConnector,
  client: Hull,
  context: {},
  code: string,
  preview: boolean
};

export type ConfResponse = {
  hostname: string,
  token: string
};

export type Config = {
  ship: string,
  secret: string,
  orgUrl: string
};

export type EngineState = {
  error?: string,
  computing: boolean,
  initialized: boolean,
  loadingRecent: boolean,
  loadingToken: boolean,
  hostname?: string,
  token?: string,
  code: string,
  config: Config,
  current?: Entry,
  recent: Array<Entry>
};
