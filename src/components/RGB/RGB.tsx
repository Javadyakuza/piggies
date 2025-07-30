import { type RGB as RGBType } from '@telegram-apps/sdk-react';
import type { FC } from 'react';

import './styles.css';

export type RGBProps = JSX.IntrinsicElements['div'] & {
  color: RGBType;
};

export const RGB: FC<RGBProps> = ({ color, className, ...rest }) => (
  <span {...rest} className={`${className} rgb`}>
    <i className='rgb__icon' style={{ backgroundColor: color }}/>
    {color}
  </span>
);
