import React from 'react';
import { Link, formatMessage } from 'umi';
import Exception from '@/components/Exception';

export default () => (
  <Exception
    type="404"
    linkElement={Link}
    desc={formatMessage({ id: 'app.exception.description.404' })}
    backText={formatMessage({ id: 'app.exception.back' })}
  />
);
