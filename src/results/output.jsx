import React from 'react';
import Area from '../ui/area';

export default ({
  userTraits = {},
  logs = "",
}) => (
  <div className='fieldPillContainer'>
    <h6 className='mt-05 mb-05 fieldPill'>Changed Properties</h6>
    <Area value={userTraits} style={{ height: 100 }} type='info'/>
    <h6 className='mt-05 mb-05 fieldPill'>Console</h6>
    <Area value={logs} type='info' wrap={true} javascript={false}/>
  </div>
);
