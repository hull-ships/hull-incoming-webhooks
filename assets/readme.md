# Incoming Webhooks

### This ship lets you process your data

Add & edit properties and emit new events with webhooks. Users will pass through this code everytime they are send with webhook.


## Left Column
One of last received Webhooks. For preview you can choose from last ten webhooks that our platform received.
For every webhook you have access to : `body`, `headers`, `cookies`, `ip`, `method`, `params`, `query`.

---

## Center Column
Write Javascript code to manipulate data, call `hull.track()` and `hull.traits()` to update User. ES6 is supported. You can't use asynchronous code and external libraries. Checkout `Variables and libraries` section to see what we can give you out of the box.

Example:
```console.log("Hello !");
   hull.asUser({ "id":"123" });
   hull.traits({ coconuts: 12 });
   hull.track("sample event");
```

##### To succeed you need to identify user with [hull.asUser()](https://github.com/hull/hull-client-node#impersonating-a-user---clientasuser)

##### You can apply [Traits operations](https://github.com/hull/hull-client-node#usertraitsproperties-context)

##### You can emit up to 10 tracking events with [hull.track()](https://github.com/hull/hull-client-node#usertrackevent-props-context)

---

## Right Column
A preview of the updated user, a summary of the changes that would be applied and eventual logs and errors from the console

- When you're satisfied with changes that will be applied to every webhook, click **Save**.
- Code will start running for each user that was sent with webhook to connector.

---

## Variables and libraries

| Function or Variable                  | Description                                                                                                                           |
|---------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `ship`                                | The Ship's data. Can be used to store additional data                                                                                 |
| `hull.asUser(userIdent)`              | A method to identify user in Hull. Method expects to receive as parameter object with at least one of properties: `email`, `id` which is Hull Id, `external_id` or `anonymous_id`. Method have to be called at least once. Every next invocation will override previous user ident. You cannot update more than one user per webhook. |
| `hull.traits(properties, context)`    | A method to Update User Traits. Optionally define a `context` with a `source` key to save in a custom group.                          |
| `hull.track('Event Name', properties)`| A method to generate new Events for the user. Can be used at most 10 times in a single run of the processor.                          |
| `hull.account(claims)`                | A method to link the Account claimed to this User.                                                                                    |
| `hull.account(claims).traits(properties, context)` | A method to Update Account Traits. If `claims` is defined, the claimed Account will be created/updated and linked to the User, else if `claims` is `null`, the Account belonging to this User will be updated. Optionally define a `context` with a `source` key to save in a custom group. |
| `hull.account(claims).track('Event Name', properties)` | A method to generate new Events for the Account.  If `claims` is defined, the claimed Account will be created/updated and linked to the User, else if `claims` is `null`, the Account belonging to this User will be updated. Can be used at most 10 times in a single run of the processor. |
| `req.body`                            | Webhook Body                                                                                                                          |
| `req.headers`                         | Webhook Headers                                                                                                                       |
| `req.cookies`                         | Webhook Cookies                                                                                                                       |
| `req.ip`                              | Webhook Sender's IP Address                                                                                                           |
| `req.method`                          | Webhook Http Method                                                                                                                   |
| `req.params`                          | Webhook Params                                                                                                                        |
| `req.query`                           | Webhook Query                                                                                                                         |
| `moment()`                            | The Moment.js library.                                                                                                                |
| `_`                                   | The lodash library.                                                                                                                   |
| `request(options, callback)`          | The request library. All request will be performed with 3000ms timeout. `options` will be passed to request() method as first argument. See request docs for all available properties. Callback will be invoked with following arguments : `(error, response, body)`. Important note - you have to use request method with `return` keyword as last line in your code. |
