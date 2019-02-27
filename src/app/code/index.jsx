// @flow
import React from "react";
import _ from "lodash";
import Codemirror from "../ui/react-codemirror";

require("codemirror/mode/javascript/javascript");

type Props = {
  onChange: string => void,
  editable: boolean,
  code: string
};

const Code = ({ editable, onChange, code }: Props) => (
  <Codemirror
    value={code}
    onChange={editable ? onChange : undefined}
    options={{
      mode: "javascript",
      readOnly: !_.isFunction(onChange) && editable
    }}
  />
);

export default Code;
