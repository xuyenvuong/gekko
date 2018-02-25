/*

 Combo strategy - maxvuong 2018-02-24

 */

var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.input = 'candle';
  this.name = 'MV_Combo';

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('sma', 'SMA', this.settings.sma.windowLength);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var sma = this.indicators.sma;
  const price = candle.close;

  log.debug('>>>>>>>>>>>>>>>>>> CANDLE: high: '+ candle.high +' close: '+ candle.close +' open: '+ candle.open +' low: '+ candle.low);
  log.debug('sma result = '+ sma.input +' age = '+ sma.input +' sum = '+ sma.input);
}

module.exports = method;
