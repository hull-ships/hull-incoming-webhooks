import React, { Component, PropTypes } from "react";
import { Col } from "react-bootstrap";
import Area from "../ui/area";
import Header from '../ui/header';

export default class UserPane extends Component {
  render() {
    const { className, sm, md, onChange, value } = this.props;
    const title = "Last Received Webhook";
    return <Col className={className} md={md} sm={sm}>
      <Header title={title}/>
      <hr/>
      <Area value={value} type="info" onChange={onChange} javascript={false}/>
    </Col>;
  }
}
