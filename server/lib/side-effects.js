// @flow
import type { Hull, Metric } from "hull";
import type { Traits, Event, Links } from "../../types";

export const callTraits = async (
  hullClient: Hull,
  data: Array<Traits>,
  entity: string = "user",
  metric: Metric
): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.map(
        async ({ traits: { attributes, context }, claims, claimsOptions }) => {
          const client = hullClient(claims, claimsOptions);
          try {
            await client.traits(attributes, context);
            successful += 1;
            return client.logger.info(`incoming.${entity}.success`, {
              attributes,
              context
            });
          } catch (err) {
            return client.logger.error(`incoming.${entity}.error`, {
              errors: err
            });
          }
        }
      )
    );
    metric.increment(`ship.incoming.${entity}s`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};

export const callEvents = async (
  hullClient: Hull,
  data: Array<Event>,
  entity: string = "event",
  metric: Metric
): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ event, claims, claimsOptions }) => {
        const { eventName, properties, context } = event;
        const client = hullClient(claims, claimsOptions);
        try {
          successful += 1;
          await client.track(eventName, properties, {
            ip: "0",
            source: "incoming-webhook",
            ...context
          });
          return client.logger.info(`incoming.${entity}.success`);
        } catch (err) {
          return client.logger.error(`incoming.${entity}.error`, {
            user: claims,
            errors: err,
            event
          });
        }
      })
    );
    metric.increment(`ship.incoming.${entity}`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};

export const callLinks = async (
  hullClient: Hull,
  data: Array<Links>,
  entity: string = "account",
  metric: Metric
): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(
        async ({
          claims,
          claimsOptions,
          accountClaims,
          accountClaimsOptions
        }) => {
          const client = hullClient(claims, claimsOptions);
          try {
            successful += 1;
            await client
              .account(accountClaims, accountClaimsOptions)
              .traits({});
            return client.logger.info(`incoming.${entity}.link.success`);
          } catch (err) {
            return client.logger.error(`incoming.${entity}.link.error`, {
              user: claims,
              account: accountClaims,
              errors: err
            });
          }
        }
      )
    );
    metric.increment(`ship.incoming.${entity}`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};
