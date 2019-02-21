import React from "react";

export default function (host, connectorId, token, className, content, footer) {
  return <div className="ps-2 pt-2 pb-2">
    {content}
    <div className="mt-1 mb-1">
      <pre><code>{`https://${host}/webhooks/${connectorId}/${token}`}</code></pre>
    </div>
    {footer}
  </div>
}
