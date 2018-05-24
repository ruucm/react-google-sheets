var fetch = require("isomorphic-fetch");
var camelCase = require("camelcase");
// subtituted code of <script src="https://apis.google.com/js/api.js"></script> at index.html
var gapi = require("./gapi");

import { log } from 'ruucm-util'

function GoogleSheetConnector(options, onLoad) {
    var sheetsData = [];
    this.sheetsLoaded = 0;
    this.apiKey = options.apiKey;
    this.clientId = options.clientId;
    this.spreadsheetId = options.spreadsheetId;

    this.initialise();

    this.getSheetsData = function() {
        return sheetsData.slice();
    };

    this.setSheetsData = function (data) {
        sheetsData = data;

        this.sheetsLoaded ++;

        if (this.sheetsLoaded === this.numSheets) {
            onDataLoaded.call(this);
        }
    };

    function onDataLoaded() {
        this.setSheetsData = null;
        console.info("Data successfuly loaded from Spreadsheet");
        if (onLoad) {
            onLoad.call(this);
        }
    }
    this.updateCell = (column, row, value, successCallback, errorCallback) => {
        var data = {
            spreadsheetId: this.spreadsheetId,
            range: 'sheet02!' + column + row,
            valueInputOption: 'USER_ENTERED',
            values: [ [value] ]
        }
        log('data', data)
        gapi.client.sheets.spreadsheets.values.update(data).then(successCallback, errorCallback);
      }
}

GoogleSheetConnector.prototype = {

    initialise: function() {
        console.info("Loading data from Spreadsheet");
        log('this.clientId', this.clientId)
        log('gapi', gapi)
        if (this.clientId) {
            return gapi.load("client:auth2", this.initClient.bind(this));
        } else if (this.apiKey) {
            var url = [
                "https://sheets.googleapis.com/v4/spreadsheets/",
                this.spreadsheetId,
                "?key=",
                this.apiKey
            ].join("");

            fetch(url)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    return this.loadSheetsData(data);
                }.bind(this));
        } else {
            console.info("You must specify a valid Client ID or API Key");
        }
    },

    loadSheetsData: function(data) {
        this.numSheets = data.sheets.length;
        data.sheets.forEach(function(sheet) {
            return this.loadSheetViaKey(sheet.properties.title);
        }, this);
    },

    loadSpreadsheet: function() {
        gapi.client.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId
        }).then(function (response) {
            var sheets = JSON.parse(response.body).sheets;
            this.numSheets = sheets.length;
            sheets.forEach(this.loadSheetViaAuth, this);
        }.bind(this));
    },

    loadSheetViaAuth: function(sheet) {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: sheet.properties.title
        }).then(function(response) {
            var values = JSON.parse(response.body).values;
            this.loadSheet(sheet.properties.title, values);
        }.bind(this));
    },

    loadSheetViaKey: function(sheetName) {
        var url = [
            "https://sheets.googleapis.com/v4/spreadsheets/",
            this.spreadsheetId,
            "/values/",
            sheetName,
            "?key=",
            this.apiKey
        ].join("");

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(json) {
                var values = json.values;
                this.loadSheet(sheetName, values);
            }.bind(this));
    },

    loadSheet: function(sheetName, values) {
        var headerRow = values[0];
        var dataRows = values.slice(1);
        var keys = headerRow.map(function(value) {
            return camelCase(value);
        }, this);

        var sheetsData = this.getSheetsData();

        sheetsData = sheetsData.concat({
            name: sheetName,
            header: headerRow,
            keys: keys,
            data: this.loadRowsData(keys, dataRows)
        });

        this.setSheetsData(sheetsData);
    },

    loadRowsData: function(keys, values) {
        return values.map(function(row) {

            keys.forEach(function(key, i) {
                row[key] = row[i];
            });

            return row;
        });
    },

    initClient: function() {
        log('initClient')
        gapi.client.init({
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            clientId: this.clientId,
            scope: "https://www.googleapis.com/auth/spreadsheets"
        }).then(function () {
            log('after initClient')
            var authInstance = gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                this.loadSpreadsheet()
            } else {
                authInstance.isSignedIn.listen(this.updateSigninStatus.bind(this));
                authInstance.signIn();
            }
        }.bind(this));
    },

    updateSigninStatus: function(isSignedIn) {
        if (isSignedIn) {
            this.loadSpreadsheet();
        }
    },

    getSheet: function(sheetName) {
        return new SheetData(this.getSheetsData(), sheetName);
    },
};

function SheetData(sheetsData, sheetName) {
    var sheet = sheetsData.find(function(sheet) {
        return sheet.name === sheetName;
    }) || {data: [], values: []};

    this.header = sheet.header;
    this.keys = sheet.keys;
    var data = sheet.data;
    var currentData = data.slice();

    this.getData = function() {
        return data.slice();
    };

    this.getCurrentData = function() {
        return currentData.slice();
    };

    this.setCurrentData = function(newData) {
        currentData = newData;
    };
}

SheetData.prototype = {
    map: function(callback) {
        return this.getCurrentData().map(callback);
    },
    filter: function(filterObj, strValue) {
        var newData = this.getData().filter(function(row) {
            if (typeof filterObj === "object") {
                for (var i in filterObj) {
                    if (!row.hasOwnProperty(i) || row[i] !== filterObj[i]) {
                        return false;
                    }
                }
            } else {
                const colIndex = this.header.indexOf(filterObj);
                if (row[colIndex] !== strValue) return false;
            }

            return true;
        }, this);

        this.setCurrentData(newData);

        return this;
    },
    group: function(colName, sort) {
        var groups = [];
        var colIndex = this.header.indexOf(colName);

        if (colIndex === -1) return this;

        this.getCurrentData().forEach(function(row) {
            var groupName = row[colIndex];
            var groupIndex = -1;

            groups.forEach(function(group, i) {
                if (group.name === groupName) groupIndex = i;
            });

            if (groupIndex > -1) {
                groups[groupIndex].data.push(row);
            } else {
                groups.push({
                    name: groupName,
                    data: [row]
                });
            }
        });

        if (sort) sortArray(groups, "name");

        this.setCurrentData(groups);
        this.dataIsGrouped = true;

        return this;
    },
    sort: function(colName) {
        var newData = this.getCurrentData();
        if (this.dataIsGrouped) {
            newData.forEach(function(group) {
                sortArray(group.data, camelCase(colName));
            });
        } else {
            sortArray(newData, camelCase(colName));
        }
        this.setCurrentData(newData);

        return this;
    },
    reverse: function() {
        var newData = this.getCurrentData();
        newData.reverse();
        this.setCurrentData(newData);
        return this;
    }
};

function sortArray(array, orderBy) {

    array.sort(function(a, b) {
        var textA = a[orderBy] ? a[orderBy].toUpperCase() : "";
        var textB = b[orderBy] ? b[orderBy].toUpperCase() : "";
        if (textA < textB) return -1;
        return textA > textB ? 1 : 0;
    });
}

module.exports = GoogleSheetConnector;