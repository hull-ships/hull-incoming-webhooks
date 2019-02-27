// @flow

import React from "react";
import Badge from "react-bootstrap/Badge";
import _ from "lodash";
import type { Webhook } from "../../../types";

const LABELS = {
  post: "success",
  get: "info",
  delete: "danger",
  put: "warning"
};

const WebhookTitle = ({
  entry,
  showDate = false
}: {
  entry?: Webhook,
  showDate?: boolean
}) =>
  !entry ? (
    "No Webhook received"
  ) : (
    <span>
      <Badge
        size="sm"
        variant={LABELS[_.get(entry, "webhookData.method", "").toLowerCase()]}
        style={{ marginRight: 5 }}
      >
        {_.get(entry, "webhookData.method")}
      </Badge>
      <span className="entry-content">
        {_.get(entry, "webhookData.headers.user-agent")}
      </span>
      {showDate ? (
        <small style={{ display: "block" }}>{entry.date}</small>
      ) : null}
    </span>
  );

export default WebhookTitle;
