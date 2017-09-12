import React from 'react';
import classnames from 'classnames';
import SVGIcon from 'svg-inline-react';
import _ from "lodash";
import styles from './icon.css';
import icons from './icon_list';

export default (props)=>{
  const pp = _.omit(props, 'styles');
  const { name, colorize, className } = pp;
  const src = icons[name];
  if (!src) {
    return <i/>;
  }
  pp.size = pp.size || 16;

  const cls = classnames({
    [styles.responsive]: !!pp.responsive,
    [styles.large]: !!pp.large,
    [styles.medium]: !!pp.medium,
    [className]: !!className,
    [styles.icon]: true,
    [styles.colorized]: !!colorize
  });
  return <SVGIcon src={src} className={cls} {...pp} />;
}
