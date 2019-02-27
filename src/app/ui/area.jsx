// @flow
import _ from "lodash";
import React, { Component } from "react";
import stringify from "json-stable-stringify";
import Codemirror from "./react-codemirror";

type Props = {
  className?: string,
  javascript?: boolean,
  wrap?: boolean,
  style?: string,
  onChange?: string => void,
  highlight?: Array<string>,
  value: string | {} | Array<any>
};

class Area extends Component<Props> {
  static defaultProps = {
    highlight: []
  };

  shouldComponentUpdate(nextProps: Props) {
    const { value } = this.props;
    return value !== nextProps.value;
  }

  buildHighlighter() {
    const { highlight } = this.props;
    const tokens = _.map(highlight, t => `("${t}":)`);
    const rgs = `(${tokens.join("|")})`;
    const rgx = new RegExp(rgs, "gi");

    return function highlighter(stream: any) {
      // https://codemirror.net/doc/manual.html#token
      // https://codemirror.net/addon/search/search.js
      stream.skipToEnd();
      const match = rgx.exec(stream.string);
      if (match && match.index) return "searching";
      return undefined;
    };
  }

  render() {
    const { className, wrap, style, onChange, value, javascript } = this.props;

    return (
      <Codemirror
        className={className}
        controlled
        style={style}
        value={
          typeof value !== "string" ? stringify(value, { space: 2 }) : value
        }
        onChange={onChange}
        options={{
          mode: {
            name: javascript ? "javascript" : "application/ld+json",
            json: true
          },
          lineWrapping: wrap,
          readOnly: "nocursor",
          viewportMargin: Infinity
        }}
      />
    );
  }
}

export default Area;
