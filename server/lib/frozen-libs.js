// @flow
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import deepFreeze from "deep-freeze";

const lodash = _.functions(_).reduce((l, key) => {
  l[key] = (...args) => _[key](...args);
  return l;
}, {});

const frozenMoment = deepFreeze((...args) => {
  return moment(...args);
});
const frozenUrijs = deepFreeze((...args) => {
  return urijs(...args);
});
const frozenLodash = deepFreeze(lodash);

export default function getFrozen() {
  return {
    moment: frozenMoment,
    urijs: frozenUrijs,
    _: frozenLodash
  };
}
