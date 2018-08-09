import React from "react";
import Area from "../ui/area";

export default ({ userTraits = {}, logs = "" }) => (
  <div className="output">
    <h6 className="mt-05 mb-05 outputContent">Changed Properties</h6>
    <Area value={userTraits} type="info" />
    <h6 className="mt-05 mb-05 outputContent">Console</h6>
    <Area value={logs} type="info" javascript={false} />
  </div>
);
