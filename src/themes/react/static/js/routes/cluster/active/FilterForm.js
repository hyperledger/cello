/**
 * Created by yuehaitao on 2017/5/5.
 */
import React, {PropTypes} from 'react'
import {Form, Select} from 'antd'
const Option = Select.Option
const FormItem = Form.Item

class FilterForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    render() {
        const {filterValue, onFilterChange} = this.props;
        return (
            <div>
                <Form layout="inline">
                    <FormItem label="Status">
                        <Select onChange={onFilterChange} style={{width: 100}} value={filterValue}>
                            <Option key="active">Active</Option>
                            <Option key="inuse">Inuse</Option>
                        </Select>
                    </FormItem>
                </Form>
            </div>
        )
    }
}

export default Form.create()(FilterForm)
