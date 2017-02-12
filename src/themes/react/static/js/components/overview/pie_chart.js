/**
 * Created by yuehaitao on 2017/2/12.
 */
import React, { PropTypes } from 'react'
import { Card, Spin } from 'antd'
import styles from './pie_chart.less'
import echarts from 'echarts'

class ChartCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  setupChart(chartId, title, names, data) {
      let myChart = echarts.init(document.getElementById(chartId));
      myChart.setOption({
          title: { text: title, x: 'right' },
          tooltip : {
              trigger: 'item',
              formatter: "{a} <br/>{b} : {c} ({d}%)"
          },
          legend: {
              orient: 'vertical',
              left: 'left',
              data: names
          },
          series : [
              {
                  name: title,
                  type: 'pie',
                  radius : '55%',
                  center: ['50%', '60%'],
                  data: data,
                  itemStyle: {
                      emphasis: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                  }
              }
          ]
      });
  }
  componentDidUpdate() {
      const { title, chartId, data } = this.props
      let names = []
      let chartData = []
      data.map((currentObject, i) => {
          names.push(currentObject.name)
          chartData.push({
              name: currentObject.name,
              value: currentObject.y
          })
      })
      this.setupChart(chartId, title, names, chartData)
  }
  render() {
      const { chartId, loading } = this.props
      return (
          <Spin spinning={loading}>
              <Card className={styles.chartCard}  bordered={false} bodyStyle={{padding:0}}>
                  <div id={chartId} style={{width: "100%", height: 240}}></div>
              </Card>
          </Spin>
      )
  }
}

export default ChartCard
