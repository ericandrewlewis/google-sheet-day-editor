import React from 'react';
import ReactDOM from 'react-dom';
import GoogleSheetEditor from './GoogleSheetEditor';
import './index.css';

const spreadsheetSchema = [
  {
    name: "Alcoholic drinks",
    type: 'integer',
    column: 'C'
  },
  {
    name: "Acidic Drinks",
    type: 'integer',
    column: 'F'
  },
  {
    name: "Acidic Meals",
    type: 'integer',
    column: 'D'
  },
  {
    name: "Cigarettes Smoked",
    type: 'integer',
    column: 'E'
  },
  {
    name: "Used cream",
    type: 'boolean',
    options: ['No', 'Yes'],
    default: 'No',
    column: 'B'
  },
];
function start() {
  ReactDOM.render(
    <GoogleSheetEditor
      clientID='127928232967-n9g0ce4f74cffs0r3hlm5l8b123ddibb.apps.googleusercontent.com'
      sheetID='1klZFbyH7-ei5Ge9MWIthUq-g1jEQ_QjoqXYfdy7l-hQ'
      sheetName='Sheet1'
      spreadsheetSchema={spreadsheetSchema} />,
    document.getElementById('root')
  );
}

window.gapi.load('client', start);
