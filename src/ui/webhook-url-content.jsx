import React from "react";

export default function (host, connectorId, token, footer) {
  return <div>
    <div className="row">
      <div className=" mt-1 col-md-6 col-md-offset-3">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title text-center">Incoming Webhooks Connector</h3>
          </div>
          <div className="panel-body text-center">
            Connector exposes webhook endpoint that you should use within your app to connect with Hull. <br/>
            Your Webhook Url: <br/>
            <input className="form-control mb-1"
                   value={`https://${host}/webhooks/${connectorId}?conf=${token}`}/>
            {footer}
          </div>
        </div>
      </div>
    </div>
  </div>
}