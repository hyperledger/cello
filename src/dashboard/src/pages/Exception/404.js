import React from 'react';
import { Link, formatMessage } from 'umi';
import Exception from '@/components/Exception';

const Exception404 = () => (
  <Exception
    type="404"
    desc={formatMessage({ id: 'app.exception.description.404' })}
    linkElement={Link}
    backText={formatMessage({ id: 'app.exception.back' })}
  />
);

export default Exception404;
