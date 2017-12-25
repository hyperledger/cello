/*
 SPDX-License-Identifier: Apache-2.0
*/
import ChartCard from './ChartCard';

const yuan = val => `&yen; ${numeral(val).format('0,0')}`;

export default {
  ChartCard,
};
