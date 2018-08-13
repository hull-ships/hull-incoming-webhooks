// @flow
import React, { Component, createRef } from "react";
import className from "classnames";
import codeMirror from "codemirror";

type ComponentProps = {
  defaultValue?: string,
  value?: string,
  codeMirrorInstance: any,
  options: Object,
  path: string,
  className?: string,
  onScroll?: Function,
  onChange?: Function,
  onFocusChange?: Function,
};

type ComponentState = {
  isFocused: boolean,
};

class CodeMirror extends Component<ComponentProps, ComponentState> {
  state = {
    isFocused: false,
  };

  _textareaRef = createRef();

  _getCodeMirrorInstance() {
    return this.props.codeMirrorInstance || codeMirror;
  }

  getCodeMirror() {
    return this.codeMirror;
  }

  componentDidMount() {
    if (this._textareaRef.current !== null) {
      const textareaNode = this._textareaRef.current;
      const codeMirrorInstance = this._getCodeMirrorInstance();
      this.codeMirror = codeMirrorInstance.fromTextArea(
        textareaNode,
        this.props.options
      );
      this.codeMirror.on("change", this.codemirrorValueChanged.bind(this));
      this.codeMirror.on("focus", this.focusChanged.bind(this, true));
      this.codeMirror.on("blur", this.focusChanged.bind(this, false));
      this.codeMirror.on("scroll", this.scrollChanged.bind(this));
      this.codeMirror.setValue(
        this.props.defaultValue || this.props.value || ""
      );
    }
  }

  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: ComponentProps) {
    if (
      this.codeMirror &&
      nextProps.value !== undefined &&
      this.codeMirror.getValue() !== nextProps.value
    ) {
      this.codeMirror.setValue(nextProps.value);
    }
    // if (typeof nextProps.options === "object") {
    //   for (const optionName in nextProps.options) {
    //     if (nextProps.options.hasOwnProperty(optionName)) {
    //       this.codeMirror.setOption(optionName, nextProps.options[optionName]);
    //     }
    //   }
    // }
  }

  focusChanged(focused: boolean) {
    this.setState(
      {
        isFocused: focused,
      },
      () => {
        if (typeof this.props.onFocusChange === "function") {
          this.props.onFocusChange(focused);
        }
      }
    );
  }

  scrollChanged(cm: any) {
    if (typeof this.props.onScroll === "function") {
      this.props.onScroll(cm.getScrollInfo());
    }
  }

  codemirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin !== "setValue") {
      this.props.onChange(doc.getValue());
    }
  }

  render() {
    const editorClassName = className(
      "ReactCodeMirror",
      this.props.className || "",
      { "ReactCodeMirror--focused": this.state.isFocused }
    );
    return (
      <div className={editorClassName}>
        <textarea
          ref={this._textareaRef}
          name={this.props.path}
          defaultValue={this.props.value}
          autoComplete="off"
        />
      </div>
    );
  }
}

module.exports = CodeMirror;
