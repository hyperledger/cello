import React from 'react';
import { Tooltip } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import style from './index.less';

const BlockChecbox = ({ value, onChange, list }) => (
  <div className={style.blockCheckbox} key={value}>
    {list.map(item => (
      <Tooltip title={item.title} key={item.key}>
        <div className={style.item} onClick={() => onChange(item.key)}>
          <img src={item.url} alt={item.key} />
          <div
            className={style.selectIcon}
            style={{
              display: value === item.key ? 'block' : 'none',
            }}
          >
            <CheckOutlined />
          </div>
        </div>
      </Tooltip>
    ))}
  </div>
);

export default BlockChecbox;
