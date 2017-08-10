
# Hull Incoming Webhooks

Run code to update User Properties and generate Events whenever Users are send to connector by webhooks.

If you want your own instance: [![Deploy]()

---

### Using :

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-incoming-webhooks.herokuapp.com/`

### Notes

### Logs

  These are log messages that are specific for Processor Connector :
    info :
      * incoming.account.link - logged after successful linking for account
      * compute.console.log - these are additional logs that should be displayed after compute
      * compute.user.debug - every user/account update will trigger logging of user and account traits that are going to be updated

### Status
  * `Settings are empty` - `error` - returned when we have no script code saved in the settings
  * `Settings are referencing invalid values` - `error` - returned when we have a script with syntax error
