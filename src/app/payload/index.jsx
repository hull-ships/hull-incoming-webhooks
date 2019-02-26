// @flow
import React from "react";
import _ from "lodash";
import Area from "../ui/area";

import type { Webhook } from "../../../types";

type Props = {
  // loading: boolean,
  current?: Webhook
};

// const getIcon = loading => (loading ? "spinner" : "reset");
const PayloadPane = ({ /* loading,  */ current }: Props) => (
  <Area
    className="flexGrow"
    value={_.get(current, "webhookData", {})}
    type="info"
    javascript={false}
  />
);

export default PayloadPane;
