/* eslint no-unused-vars:0, no-useless-constructor:0, import/no-unresolved:0 */
import React, { Component } from "react";
import { Modal } from "react-bootstrap";

export default class InputSelect extends Component {
  autoSelect = e => {
    e.target.focus();
    e.target.select();
  };

  render() {
    const { host, connectorId, token, content, footer, show, actions } = this.props;
    return (
      <Modal verticallyCenter show={show}>
        <Modal.Body>
          <div className="ps-2">
            <div>
              <h3 className="mt-1 mb-0 text-center">
                Configure your incoming webhook
              </h3>
              <h1 className="mt-0 mb-0 text-center">🤓</h1>
              <p>
                {content}
              </p>
            </div>

            <div className="mt-1 mb-1">
              <input
                ref={n => (this.node = n)}
                type="text"
                onClick={this.autoSelect}
                className="form-control input-monospace"
                value={`https://${host}/webhooks/${connectorId}/${token}`}
                readonly
                data-autoselect=""
              />
            </div>
            <div className="mb-1">
              {footer}
            </div>
          </div>
        </Modal.Body>
        {actions && <Modal.Footer>{actions}</Modal.Footer>}
      </Modal>
    );
  }
}
