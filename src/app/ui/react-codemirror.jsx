// @flow

import React, { Component } from "react";
import { Controlled } from "react-codemirror2";

/* eslint-disable */
import JavascriptMode from "codemirror/mode/javascript/javascript";
import SublimeKeymap from "codemirror/keymap/sublime";
import closeBrackets from "codemirror/addon/edit/closebrackets";
import matchBrackets from "codemirror/addon/edit/matchbrackets";
import autorefresh from "codemirror/addon/display/autorefresh";
import hint from "codemirror/addon/hint/javascript-hint";
import highlighter from "codemirror/addon/search/match-highlighter";

import activeLine from "codemirror/addon/selection/active-line";

import commentCode from "codemirror/addon/comment/comment";
import commentFold from "codemirror/addon/fold/comment-fold";

import foldCode from "codemirror/addon/fold/foldcode";
import foldGutter from "codemirror/addon/fold/foldgutter";

import braceFold from "codemirror/addon/fold/brace-fold";
import indentFold from "codemirror/addon/fold/indent-fold";

/* eslint-enable */

const DEFAULT_OPTIONS = {
  indentUnit: 2,
  keyMap: "sublime",
  lineNumbers: true,
  lineWrapping: true,
  mode: "application/ld+json",
  smartIndent: true,
  viewportMargin: Infinity
};

const EDITABLE_OPTIONS = {
  lint: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  styleActiveLine: true,
  autoRefresh: true,
  foldGutter: true,
  gutters: [
    "CodeMirror-lint-markers",
    "CodeMirror-linenumbers",
    "CodeMirror-foldgutter"
  ]
};

type Props = {
  className?: string,
  onChange?: string => void,
  options: {},
  path?: string,
  value: string,
  options?: {
    mode?: string | {},
    readOnly?: boolean | string
  }
};

type State = {
  value: string
};

export default class CodeMirror extends Component<Props, State> {
  state = {
    /* eslint-disable-next-line react/destructuring-assignment */
    value: this.props.value
  };

  onBeforeChange = (editor: any, data: any, value: string) =>
    this.setState({ value });

  onChange = (editor: any, data: any, value: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(value);
    }
  };

  componentWillReceiveProps = (nextProps: Props) => {
    /* eslint-disable-next-line react/destructuring-assignment */
    if (nextProps.value !== this.state.value) {
      this.setState({ value: nextProps.value });
    }
  };
  //
  // shouldComponentUpdate = (nextProps: Props) => {
  //   /* eslint-disable-next-line react/destructuring-assignment */
  //   return nextProps.value !== this.state.value;
  // };

  render() {
    const { className, path, options = {} } = this.props;
    const { value } = this.state;
    // const CM = controlled ? Controlled;

    const opts = {
      ...DEFAULT_OPTIONS,
      ...EDITABLE_OPTIONS,
      styleActiveLine: !options.readOnly,
      matchBrackets: !options.readOnly,
      extraKeys: {
        "Cmd-Alt-[": c => c.foldCode(c.getCursor(), null, "fold"),
        "Cmd-Alt-]": c => c.foldCode(c.getCursor(), null, "unfold"),
        "Cmd-/": c => c.toggleComment(),
        "Ctrl-Q": c => c.foldCode(c.getCursor())
      },
      ...options,
      viewportMargin: Infinity
    };
    return (
      <Controlled
        className={`${className || ""} code-editor`}
        onBeforeChange={this.onBeforeChange}
        onChange={this.onChange}
        name={path}
        value={value}
        options={opts}
      />
    );
  }
}
