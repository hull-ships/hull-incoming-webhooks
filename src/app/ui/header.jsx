// @flow
import React from "react";

const Header = ({ title, children }: { title?: any, children: React$Node }) => (
  <div className="flexRow header">
    {title && <h5 className="mb-0 mt-025 text-muted flexGrow">{title}</h5>}
    {children}
  </div>
);

export default Header;
