import React from 'react';
import { Link, formatMessage } from 'umi';
import Exception from '@/components/Exception';

const Exception500 = () => (
  <Exception
    type="500"
    desc={formatMessage({ id: 'app.exception.description.500' })}
    linkElement={Link}
    backText={formatMessage({ id: 'app.exception.back' })}
  />
);

export default Exception500;
