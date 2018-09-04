import React from "react";

export default ({ title, children }) => (
  <div className="flexRow">
    <h5 className="mb-0 mt-0 text-muted flexGrow" style={{ paddingTop: 8 }}>
      {title}
    </h5>
    {children}
  </div>
);
