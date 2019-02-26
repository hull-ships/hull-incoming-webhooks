// @flow
import React, { Fragment } from "react";
import { DropdownButton, MenuItem, Button } from "react-bootstrap";
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
      bsClass="btn refresh-button"
      btnStyle="link"
      disabled={loading}
      onClick={onRefresh}
    >
      {loading ? <Spinner className="loading-spinner" /> : <Sync />}
    </Button>
    <DropdownButton
      className="last-payload-button"
      bsStyle="pill"
      bsSize="small"
      id="last-payload"
      title={<PayloadTitle entry={current} />}
      key={_.get(current, "date")}
      onSelect={onSelect}
    >
      {history.map((entry, idx) => (
        <MenuItem
          key={entry.date}
          id={`last-entry-${idx}`}
          eventKey={entry.date}
          style={{ textAlign: "left" }}
        >
          <PayloadTitle entry={entry} showDate />
        </MenuItem>
      ))}
    </DropdownButton>
  </Fragment>
);
export default List;
