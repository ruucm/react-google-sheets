'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ReactGoogleSheets = require('./ReactGoogleSheets');

var _ReactGoogleSheets2 = _interopRequireDefault(_ReactGoogleSheets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_ReactGoogleSheets2.default.connect = _ReactGoogleSheets.connectToSpreadsheet;
exports.default = _ReactGoogleSheets2.default;