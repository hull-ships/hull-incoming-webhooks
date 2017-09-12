import React from 'react';
import Area from '../ui/area';

export default ({errors}) => (
  <div className='output'>
    <Area value={errors} type='danger' javascript={false}/>
  </div>
)
