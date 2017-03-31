/**
 * Created by yuehaitao on 2017/2/12.
 */
import React, { PropTypes } from 'react'
import { Card, Spin } from 'antd'
import styles from './ChartCard.less'
import echarts from 'echarts'
import ReactEcharts from 'echarts-for-react'
import westeros from '../../components/echarts/theme/westeros.json'

class ChartCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.getOptions = this.getOptions.bind(this)
  }
  registerTheme() {
    echarts.registerTheme('westeros', westeros)
  }
  getOptions() {
      const { title, data } = this.props
      let names = []
      let chartData = []
      data.map((currentObject, i) => {
          names.push(currentObject.name)
          chartData.push({
              name: currentObject.name,
              value: currentObject.y
          })
      })
      return {
          title: { text: title, x: 'right', y: 'bottom' },
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
                  data: chartData,
                  itemStyle: {
                      emphasis: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                  }
              }
          ]
      }
  }
  render() {
      const { chartId, loading } = this.props
      this.registerTheme()
      return (
          <Spin spinning={loading}>
              <Card className={styles.chartCard}  bordered={false} bodyStyle={{padding:0}}>
                  <ReactEcharts
                      ref={chartId}
                      style={{width: "100%", height: 240}}
                      notMerge={true}
                      lazyUpdate={true}
                      theme="westeros"
                      option={this.getOptions()}/>
              </Card>
          </Spin>
      )
  }
}

export default ChartCard
