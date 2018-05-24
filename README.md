# react google sheets

Simplely Add Google Sheets API to your react app

# Quickstart

## First, install the library:
```shell
npm install --react-google-sheets
```

or 

```shell
yarn add react-google-sheets
```

## Second, Turn on the Google Sheets API:

- Use this [wizard](https://console.developers.google.com/flows/enableapi?apiid=sheets.googleapis.com) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then **Go to credentials**.

- On the **Add credentials to your project** page, click the **Cancel** button.

- At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the Save button.
- Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
- Select the application type **Other**, enter the name "React Google Sheets Quickstart", and click the **Create** button.

## Finally, Use the library:

```javascript
import ReactGoogleSheets from 'react-google-sheets';


class DataComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sheetLoaded: false,
    }
  }
  render() {
    return (
      <ReactGoogleSheets 
        clientId={YOUR_CLIENT_ID}
        apiKey={YOUR_API_KEY}
        spreadsheetId={YOUR_SPREADSHEET_ID}
        afterLoading={() => this.setState({sheetLoaded: true})}
      >
        {this.state.sheetLoaded ? 
          <div>
            {/* Access Data */}
            {console.log('Your sheet data : ', this.props.getSheetsData({YOUR_SPREADSHEET_NAME}))}
            {/* Update Data */}
            <button onClick={() => {
              this.props.updateCell(
                'sheet02', // sheetName
                'E', // column
                13, // row
                'Apple', // value
                null, // successCallback
                (error) => {
                  console.log('error', error)
                } // errorCallback
              );
            }}>update cell!</button>
          </div>
          :
          'loading...'
        }
      </ReactGoogleSheets>
    )
  }
}

export default ReactGoogleSheets.connect(DataComponent);


```


That's It!
