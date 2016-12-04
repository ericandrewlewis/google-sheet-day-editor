import React, { Component } from 'react';
import './GoogleSheetEditor.css';

function loadSheetsApi() {
  return new Promise((resolve, reject) => {
    var discoveryUrl =
        'https://sheets.googleapis.com/$discovery/rest?version=v4';
    window.gapi.client.load(discoveryUrl)
      .then(() => {
        resolve()
      })
  })
}

function sortSpreadsheetSchema(schema) {
  const newSchema = Array.from(schema);
  newSchema.sort((a,b) => a.column > b.column)
  return newSchema
}

function lastColumnFromSchema(schema) {
  return String.fromCharCode(65 + schema.length)
}

class GoogleSheetEditor extends Component {
  constructor(props) {
    super()
    this.state = {
      authorized: false,
      spreadsheetSchema: sortSpreadsheetSchema(props.spreadsheetSchema),
    }
    this.handleAuthResult = this.handleAuthResult.bind(this);
    this.handleAuthClick = this.handleAuthClick.bind(this);
    this.updateSheetData = this.updateSheetData.bind(this);
    this.fillMissingDatesInSheet = this.fillMissingDatesInSheet.bind(this);
    this.updateFieldValue = this.updateFieldValue.bind(this);

  }
  // After the component mounts, make sure we're authorized with the Google API.
  componentDidMount() {
    window.gapi.auth.authorize(
      {
        'client_id': this.props.clientID,
        'scope': 'https://www.googleapis.com/auth/spreadsheets',
        'immediate': true
      }, this.handleAuthResult);
  }
  handleAuthClick() {
    window.gapi.auth.authorize(
      {
        client_id: this.props.clientID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        immediate: false
      },
      this.handleAuthResult);
  }

  fillMissingDatesInSheet() {
    const {sheetData} = this.state
    var processingDate = new Date(
      sheetData[sheetData.length - 1][0]
    )
    var todaysDate = new Date()
    var newValues = []
    while (processingDate.toDateString() !== todaysDate.toDateString()) {
      processingDate.setDate(processingDate.getDate() + 1)
      var dateString = (processingDate.getMonth() + 1) + "/" + processingDate.getDate() + "/" + processingDate.getFullYear()

      let newRow = [dateString]
      this.state.spreadsheetSchema.forEach((field) => {
        switch(field.type) {
          case 'integer':
            newRow = newRow.concat('0')
            break
          case 'boolean':
            newRow = newRow.concat(field.default)
            break
          default:
            break
        }
      })
      console.log(newRow)
      newValues.push(newRow)
    }
    if (newValues.length < 1) {
      return Promise.resolve()
    }
    window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: this.props.sheetID,
      range: `${this.props.sheetName}!A2:D`,
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      values: newValues
    }).then(() => this.updateSheetData )
  }
  updateSheetData() {
    return window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.props.sheetID,
      range: `${this.props.sheetName}!A2:${lastColumnFromSchema(this.state.spreadsheetSchema)}`,
    }).then((response) => {
      return new Promise((resolve, reject) => {
        this.setState({
          sheetData: response.result.values
        }, resolve)
      })
    })
  }
  handleAuthResult(authResult) {
    if (!authResult || authResult.error) {
      console.log('There was a problem authorizing')
      console.log(authResult)
      return
    }
    this.setState({authorized: true})
    loadSheetsApi()
      .then(this.updateSheetData)
      .then(this.fillMissingDatesInSheet)
  }

  _renderUnauthorized() {
    return (
      <div>
        <span>Authorize access to Google Sheets API</span>
        <button id="authorize-button" onClick={this.handleAuthClick}>
          Authorize
        </button>
      </div>
    )
  }
  updateFieldValue(column, value) {
    var rowIndex = 1 + this.state.sheetData.length
    window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: this.props.sheetID,
      range: `${this.props.sheetName}!${column}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      values: [[value]]
    }).then(this.updateSheetData)
  }
  render() {
    if (!this.state.authorized) {
      return this._renderUnauthorized()
    }
    if (!this.state.sheetData) {
      return <div>loading</div>
    }
    const todaysData = this.state.sheetData[this.state.sheetData.length - 1]
    return (
      <div>
        {this.state.spreadsheetSchema.map((field, index) => {
          const offset = field.column.charCodeAt(0) - 65
          return (
            <Field key={index} field={field} value={todaysData[offset]} updateFieldValue={this.updateFieldValue} />
          )
        })}
      </div>
      // <div className="App">
      //   <div className="App-header">
      //     <img src={logo} className="App-logo" alt="logo" />
      //     <h2>Welcome to React</h2>
      //   </div>
      //   <p className="App-intro">
      //     To get started, edit <code>src/App.js</code> and save to reload.
      //   </p>
      // </div>
    );
  }
}

GoogleSheetEditor.propTypes = {
  clientID: React.PropTypes.string.isRequired,
  sheetID: React.PropTypes.string.isRequired,
  sheetName: React.PropTypes.string.isRequired,
  // spreadsheetSchema:
}

class Field extends Component {
  updateFieldValue(newValue) {
    this.props.updateFieldValue(this.props.field.column, newValue)
  }
  render() {
    const {field} = this.props
    let button
    if (field.type === 'integer') {
      button = <button onClick={ (event) => { this.updateFieldValue(parseInt(this.props.value, 10) + 1) } }>+</button>
    }
    if (field.type === 'boolean') {
      button = (
        <span>
          <button onClick={ (event) => { this.updateFieldValue(field.options[0]) } }>{field.options[0]}</button>&nbsp;&nbsp;
          <button onClick={ (event) => { this.updateFieldValue(field.options[1]) } }>{field.options[1]}</button>
        </span>
      )
    }
    return (
      <h2>
        {field.name}: {this.props.value}&nbsp;&nbsp;{button}
      </h2>
    )
  }
}

export default GoogleSheetEditor;
