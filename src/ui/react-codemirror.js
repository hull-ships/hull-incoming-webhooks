import * as React from "react";
import PropTypes from "proptypes";
import className from "classnames";
import codeMirror from "codemirror";

class CodeMirror extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
    onChange: PropTypes.object,
  };

  static defaultProps = {
    value: "",
    options: {},
    onChange: () => null,
  };

  state = {
    isFocused: false,
  };

  _textareaRef = React.createRef();
  _codeMirror = null;

  _getCodeMirrorInstance() {
    return codeMirror;
  }

  getCodeMirror() {
    return this._codeMirror;
  }

  componentDidMount() {
    if (this._textareaRef.current !== null) {
      const textareaNode = this._textareaRef.current;
      const codeMirrorInstance = this._getCodeMirrorInstance();
      this._codeMirror = codeMirrorInstance.fromTextArea(
        textareaNode,
        this.props.options
      );
      if (this._codeMirror !== null) {
        this._codeMirror.on("change", this.codemirrorValueChanged.bind(this));
        this._codeMirror.on("focus", this.focusChanged.bind(this, true));
        this._codeMirror.on("blur", this.focusChanged.bind(this, false));
        this._codeMirror.setValue(this.props.value);
      }
    }
  }

  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this._codeMirror) {
      this._codeMirror.toTextArea();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      this._codeMirror &&
      nextProps.value !== undefined &&
      this._codeMirror.getValue() !== nextProps.value
    ) {
      this._codeMirror.setValue(nextProps.value);
    }
    // if (typeof nextProps.options === "object") {
    //   for (const optionName in nextProps.options) {
    //     if (nextProps.options.hasOwnProperty(optionName)) {
    //       this._codeMirror.setOption(optionName, nextProps.options[optionName]);
    //     }
    //   }
    // }
  }

  focusChanged(isFocused) {
    this.setState({ isFocused });
  }

  codemirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin !== "setValue") {
      this.props.onChange(doc.getValue());
    }
  }

  render() {
    const editorClassName = className("ReactCodeMirror", {
      "ReactCodeMirror--focused": this.state.isFocused,
    });
    return (
      <div className={editorClassName}>
        <textarea
          ref={this._textareaRef}
          defaultValue={this.props.value}
          autoComplete="off"
        />
      </div>
    );
  }
}

module.exports = CodeMirror;
