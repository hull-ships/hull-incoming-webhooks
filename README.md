
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
      * compute.user.computed - logged after successful computing traits about user in user-update
      * compute.account.computed - logged after successful computing traits about account in user-update
      * compute.account.link - logged after successful linking for account
      * compute.user.computed - logged after successful computing
      * compute.user.error - logged when encountered error during compute operation
      * compute.console.log - these are additional logs that should be displayed after compute
      * compute.error - general logging about errors that encountered during updating user

    error :
      * fetch.user.events.error - logged when encountered error during user events fetch
      * fetch.user.segments.error - logged when encountered error during user segments fetch
      * fetch.user.report.error - logged when encountered problems during search for user reports
      * fetch.user.error - logged when encountered error during user fetch

