// @flow
import React, { Fragment } from "react";
import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownItem from "react-bootstrap/DropdownItem";
import Button from "react-bootstrap/Button";
import _ from "lodash";
import type { Webhook } from "../../../types";
import PayloadTitle from "./payload-title";
import Sync from "./sync";
import Spinner from "./spinner";

const List = ({
  loading,
  history = [],
  current,
  onSelect,
  onRefresh
}: {
  current?: Webhook,
  history?: Array<Webhook>,
  loading: boolean,
  onRefresh: () => void,
  onSelect: string => void
}) => (
  <Fragment>
    <Button
      bsPrefix="btn refresh-button"
      disabled={loading}
      onClick={onRefresh}
    >
      {loading ? <Spinner className="loading-spinner" /> : <Sync />}
    </Button>
    <DropdownButton
      className="last-payload-button"
      variant="primary"
      size="sm"
      id="last-payload"
      title={<PayloadTitle entry={current} />}
      key={_.get(current, "date")}
      onSelect={onSelect}
    >
      {history.map((entry, idx) => (
        <DropdownItem
          key={entry.date}
          id={`last-entry-${idx}`}
          eventKey={entry.date}
          style={{ textAlign: "left" }}
        >
          <PayloadTitle entry={entry} showDate />
        </DropdownItem>
      ))}
    </DropdownButton>
  </Fragment>
);
export default List;
