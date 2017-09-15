import React, { Component } from "react";
import { Modal, Button, Row, Col, Table } from "react-bootstrap";
import Icon from './icon';

export default class Help extends Component {
  constructor(props) {
    super(props);
    this.state = { showModal: false, ...props };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    const sample = `
console.log("Hello !");
hull.user({ id: "123" }).traits({ coconuts: 12 });
hull.user({ id: "123" }).track("sample event");
    `;
    return (
      <div>
        <Button bsStyle="warning" bsSize="sm" className='btn-pill btn-rounded' onClick={this.open.bind(this)} > Help </Button>

        <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title><div className='text-center'>Incoming Webhook Processor</div></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={10} mdOffset={1}>
                <Row>
                  <Col xs={3} sm={2}>
                    <p>
                      <Icon name='calculator' responsive/>
                    </p>
                  </Col>
                  <Col xs={9} sm={10}>
                    <p>
                      <strong>This ship lets you process data coming from any incoming webhook</strong>, add & edit User and Account properties and emit new events.
                    </p>
                  </Col>
                </Row>

                <hr/>

                <Row>
                  <Col sm={8}>
                    <p><Icon name='compute' large/></p>
                    <p>On the <strong>Sidebar</strong>, Write Javascript code to manipulate data, call <code>hull.user()</code> to identify user and then <code>traits()</code> and <code>track()</code> to update his traits and emit new events. ES6 is supported. You can't use asynchronous code (only `request` method is available) and you can't use external libraries.</p>
                    <h6>Example: </h6>
                    <pre>
                      <small>
                        <code>{sample}</code>
                      </small>
                    </pre>
                    <p>
                      <small>
                        Before every <code>track</code> and <code>traits</code> You have to call <a target="_blank" href="https://github.com/hull/hull-client-node#impersonating-a-user---clientasuser">user</a> or account method to provide user/account identity.<br/>
                        Invoking <code>user</code> method requires to pass as argument at least on of the following properties:<br/>
                        <code>external_id</code>, <code>anonymous_id</code>, <code>email</code>, <code>id (which is id in hull)</code>.
                      </small>
                    </p>
                    <p>
                      <small>
                        You can apply <a target="_blank" href="https://github.com/hull/hull-client-node#usertraitsproperties-context">Traits operations</a>.
                      </small>
                    </p>
                    <p>
                      <small>
                        You can emit up to 10 events with <a target="_blank" href="https://github.com/hull/hull-client-node#usertrackevent-props-context">hull.track()</a>.
                      </small>
                    </p>
                  </Col>
                  <Col sm={4}>
                    <Col sm={12}>
                      <p><Icon name='rocker' large/></p>
                      <p>
                        In <strong>Last Received Webhooks</strong> column we are keeping 100 last received requests from your application
                      </p>
                    </Col>

                    <Col sm={12}>
                      <p><Icon name='rocker' large/></p>
                      <p>
                        In <strong>Payload</strong> column you can see data from picked webhook request. You will see object with following properties:<hr/>
                        <strong>body</strong>, <strong>headers</strong>, <strong>ip</strong>, <strong>method</strong>, <strong>params</strong>, <strong>query</strong>
                      </p>
                    </Col>

                    <Col sm={12}>
                      <p><Icon name='punker' large/></p>
                      <p>On the <strong>right</strong>, a preview of the summary of the changes that was applied to user/accounts when webhook arrived, eventual logs and errors from the console and changes that would be applied with current code</p>

                      <p>When you're satisfied with current code, click <strong>Save</strong></p>
                    </Col>
                  </Col>
                </Row>

                <hr/>

                <Row>
                  <Col sm={12}>
                    <h4>Variables and libraries you can access</h4>

                  </Col>
                </Row>
                <Table striped bordered condensed hover className='mt-1'>
                  <tbody>
                    <tr>
                      <td><code>ship</code></td>
                      <td><p><small>The Connectors's data. Can be used to store additional details.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.user(userIdentity, additionalOptions)</code></td>
                      <td><p><small>A method to provide user's <a href="https://github.com/hull/hull-client-node#impersonating-a-user---clientasuser" target="_blank">identity</a>. Calling this method without <code>traits</code> or <code>track</code> has no effect.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.user(userIdentity, additionalOptions).traits(properties, context)</code></td>
                      <td><p><small><a href="https://github.com/hull/hull-client-node#usertraitsproperties-context" target="_blank">Update User Traits</a>. Optionally define a context with a <code>source</code> key to save in a custom group</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.user(userIdentity, additionalOptions).track('Event Name', properties)</code></td>
                      <td><p><small>Lets you <a href="https://github.com/hull/hull-client-node#usertrackevent-props-context" target="_blank"> generate new Events</a> for the user.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(accountIdentity, additionalOptions)</code></td>
                      <td><p><small>A method to identify account. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(accountIdentity, additionalOptions).traits(properties, context)</code></td>
                      <td><p><small>A method to Update Account Traits. If <code>claims</code> is defined, the claimed Account will be created/updated and linked to the User, else if <code>claims</code> is <code>null</code>, the Account belonging to this User will be updated. Optionally define a <code>context</code> with a <code>source</code> key to save in a custom group. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>body</code></td>
                      <td><p><small>The Webhook's Body</small></p></td>
                    </tr>

                    <tr>
                      <td><code>headers</code></td>
                      <td><p><small>The Webhook's Headers</small></p></td>
                    </tr>

                    <tr>
                      <td><code>cookies</code></td>
                      <td><p><small>The Webhook's Cookies</small></p></td>
                    </tr>

                    <tr>
                      <td><code>ip</code></td>
                      <td><p><small>The webhook's ip</small></p></td>
                    </tr>

                    <tr>
                      <td><code>method</code></td>
                      <td><p><small>The Webhook's Method</small></p></td>
                    </tr>

                    <tr>
                      <td><code>params</code></td>
                      <td><p><small>The Webhook's Params</small></p></td>
                    </tr>

                    <tr>
                      <td><code>query</code></td>
                      <td><p><small>The Webhook's Query</small></p></td>
                    </tr>

                    <tr>
                      <td><code>moment()</code></td>
                      <td><p><small>The <a href="http://momentjs.com/" target='_blank'>Moment.js</a> library.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>_</code></td>
                      <td><p><small>The <a href="https://lodash.com/" target='_blank'>lodash</a> library.</small></p></td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
