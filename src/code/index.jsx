import React, { Component } from "react";
import Codemirror from "../ui/react-codemirror";
import _ from "lodash";

require("codemirror/mode/javascript/javascript");

export default class Code extends Component {
  render() {
    const { className, onChange, value } = this.props;

    const options = {
      mode: "javascript",
      lineNumbers: true,
      gutters: ["CodeMirror-lint-markers"],
      lint: true,
      readOnly: !_.isFunction(onChange),
    };

    return (
      <div className={className}>
        <Codemirror value={value} onChange={onChange} options={options} />
      </div>
    );
  }
}
