import React from 'react'
import ReactExport from 'react-data-export'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

const ExcelFile = ReactExport.ExcelFile
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn

export default class Download extends React.Component {
    render() {
        return (
            <Card>
                <Card.Body>
                    <p><b>Step 5 - Download</b></p>
                    <div>
                        <ExcelFile element={<Button>Download Data</Button>}>
                            <ExcelSheet data={this.props.fileName} name="FICHES FOUND">
                                <ExcelColumn label="SITE_CD" value="siteCode"/>
                                <ExcelColumn label="PAGE_TYPE" value="sitePlatform"/>
                                <ExcelColumn label="URL" value="url"/>
                                <ExcelColumn label="DISPLAY NAME" value="displayName"/>
                                <ExcelColumn label="SKU" value="sku"/>
                                <ExcelColumn label="FICHE" value="fiche"/>
                            </ExcelSheet>
                            <ExcelSheet data={this.props.fileNotFound} name="FICHES NOT FOUND">
                                <ExcelColumn label="SITE_CD" value="siteCode"/>
                                <ExcelColumn label="PAGE_TYPE" value="sitePlatform"/>
                                <ExcelColumn label="URL" value="url"/>
                                <ExcelColumn label="SKU" value="sku"/>
                            </ExcelSheet>
                            <ExcelSheet data={this.props.fileError} name="ERRORS">
                                <ExcelColumn label="SITE_CD" value="siteCode"/>
                                <ExcelColumn label="PAGE_TYPE" value="sitePlatform"/>
                                <ExcelColumn label="URL" value="url"/>
                                <ExcelColumn label="ERROR" value="error"/>
                            </ExcelSheet>
                        </ExcelFile>
                    </div>
                </Card.Body>
            </Card>  
        )
    }
}