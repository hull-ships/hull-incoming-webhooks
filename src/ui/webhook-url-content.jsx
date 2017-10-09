import React from "react";

export default function (host, connectorId, token, className, content, footer) {
  return <div>
    <div className="row">
      <div className={`${className} mt-1 col-md-6 col-md-offset-3`}>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title text-center">Incoming Webhooks Connector</h3>
          </div>
          <div className="panel-body text-center">
            {content}
            <div className="mb-1">
              Your Webhook Url:
              <pre><code>{`https://${host}/webhooks/${connectorId}/${token}`}</code></pre>
            </div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  </div>
}
