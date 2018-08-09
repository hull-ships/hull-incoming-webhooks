import React, { Component } from "react";
import className from "classnames";

class CodeMirror extends Component {
  state = {
    isFocused: false,
  };

  _getCodeMirrorInstance() {
    return this.props.codeMirrorInstance || require("codemirror");
  }

  getCodeMirror() {
    return this.codeMirror;
  }

  componentDidMount() {
    const textareaNode = this.refs.textarea;
    const codeMirrorInstance = this._getCodeMirrorInstance();
    this.codeMirror = codeMirrorInstance.fromTextArea(
      textareaNode,
      this.props.options
    );
    this.codeMirror.on("change", this.codemirrorValueChanged.bind(this));
    this.codeMirror.on("focus", this.focusChanged.bind(this, true));
    this.codeMirror.on("blur", this.focusChanged.bind(this, false));
    this.codeMirror.on("scroll", this.scrollChanged.bind(this));
    this.codeMirror.setValue(this.props.defaultValue || this.props.value || "");
  }

  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.codeMirror &&
      nextProps.value !== undefined &&
      this.codeMirror.getValue() != nextProps.value
    ) {
      this.codeMirror.setValue(nextProps.value);
    }
    if (typeof nextProps.options === "object") {
      for (let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.codeMirror.setOption(optionName, nextProps.options[optionName]);
        }
      }
    }
  }

  focusChanged(focused) {
    this.setState({
      isFocused: focused,
    });

    this.props.onFocusChange && this.props.onFocusChange(focused);
  }

  scrollChanged(cm) {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  }

  codemirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin !== "setValue") {
      this.props.onChange(doc.getValue());
    }
  }

  render() {
    const editorClassName = className(
      "ReactCodeMirror",
      this.state.isFocused ? "ReactCodeMirror--focused" : null,
      this.props.className
    );
    return (
      <div className={editorClassName}>
        <textarea
          ref="textarea"
          name={this.props.path}
          defaultValue={this.props.value}
          autoComplete="off"
        />
      </div>
    );
  }
}

module.exports = CodeMirror;
