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

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

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

  if (smaShort.result > smaLong.result) {

    if (this.trend.direction != 'up') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };
    }

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
      log.debug('TREND UP   >>>>>> CANDLE: H: ' + candle.high + ' C: ' + candle.close + ' O: ' + candle.open + ' L: ' + candle.low);
      log.debug(' smaShort result = ' + smaShort.result + ' age = ' + smaShort.age + ' sum = ' + smaShort.sum);
      log.debug(' smaLong  result = ' + smaLong.result + ' age = ' + smaLong.age + ' sum = ' + smaLong.sum);
    } else
      this.advice();

  } else if (smaShort.result < smaLong.result) {

    // new trend detected
    if(this.trend.direction !== 'down') {
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };
    }
  this.trend.duration++;

  log.debug('In downtrend since', this.trend.duration, 'candle(s)');

  if(this.trend.duration >= this.settings.thresholds.persistence)
    this.trend.persisted = true;

  if(this.trend.persisted && !this.trend.adviced) {
    this.trend.adviced = true;
    this.advice('short');

    log.debug('TREND DOWN >>>>>> CANDLE: H: ' + candle.high + ' C: ' + candle.close + ' O: ' + candle.open + ' L: ' + candle.low);
    log.debug(' smaShort result = ' + smaShort.result + ' age = ' + smaShort.age + ' sum = ' + smaShort.sum);
    log.debug(' smaLong  result = ' + smaLong.result + ' age = ' + smaLong.age + ' sum = ' + smaLong.sum);
  } else
    this.advice();

  }
}

module.exports = method;
