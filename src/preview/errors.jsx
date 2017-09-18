import React from 'react';
import Area from '../ui/area';

export default ({errors, highlight}) => (
  <div className='output'>
    <Area highlight={highlight} value={errors} type='danger' javascript={false}/>
  </div>
)
