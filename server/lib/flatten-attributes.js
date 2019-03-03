// @flow
import _ from "lodash";
import type { Attributes } from "../../types";

// Creates a flat object from `/` and `source` parameters
const flatten = (traits: Attributes) =>
  _.reduce(
    traits,
    (payload, { properties, context = {} } = {}) => {
      if (properties) {
        const { source } = context;
        _.map(
          _.mapKeys(properties, (v, k) =>
            (source ? `${source}/${k}` : k).replace(".", "/")
          ),
          (v, k) => _.setWith(payload, k, v)
        );
      }
      return payload;
    },
    {}
  );

export default flatten;
