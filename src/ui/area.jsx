import _ from "lodash";
import React, { Component } from "react";
import Codemirror from "./react-codemirror";
import stringify from "json-stable-stringify";

export default class Area extends Component {
  componentDidUpdate() {
    this.props.highlight &&
      this.props.highlight.length &&
      this.cm &&
      this.cm.addOverlay({ token: this.buildHighlighter() });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { value } = this.props;
    return value !== nextProps.value;
  }

  buildHighlighter() {
    const tokens = _.map(this.props.highlight, t => `("${t}":)`);
    const rgs = `(${tokens.join("|")})`;
    const rgx = new RegExp(rgs, "gi");

    return function highlighter(stream) {
      // https://codemirror.net/doc/manual.html#token
      // https://codemirror.net/addon/search/search.js
      stream.skipToEnd();
      const match = rgx.exec(stream.string);
      if (match && match.index) return "searching";
      return undefined;
    };
  }

  render() {
    let { wrap, style, onChange, value } = this.props;
    if (typeof value !== "string") value = stringify(value, { space: 2 });

    return (
      <Codemirror
        style={style}
        ref={c => (this.cm = c && c.getCodeMirror())}
        value={value}
        onChange={onChange}
        options={{
          mode: {
            name: this.props.javascript ? "javascript" : "application/ld+json",
            json: true,
          },
          lineWrapping: wrap,
          readOnly: true,
        }}
      />
    );
  }
}
