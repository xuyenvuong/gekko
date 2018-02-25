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
  this.addIndicator('smaShort', 'SMA', this.settings.sma.shortWindowLength);
  this.addIndicator('smaLong', 'SMA', this.settings.sma.longWindowLength);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var smaShort = this.indicators.smaShort;
  var smaLong = this.indicators.smaLong;
  const price = candle.close;

  log.debug('>>>>>>>>>>>>>>>>>> CANDLE: H: '+ candle.high +' C: '+ candle.close +' O: '+ candle.open +' L: '+ candle.low);
  log.debug('smaShort result = '+ smaShort.result +' age = '+ smaShort.age +' sum = '+ smaShort.sum);
  log.debug('smaLong  result = '+ smaLong.result +' age = '+ smaLong.age +' sum = '+ smaLong.sum);
}

module.exports = method;
