
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import styles from './Footer.less'
import { config } from '../../utils'

const Footer = () => <div className={styles.footer}>
  {config.footerText}
</div>

export default Footer
