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
    diff: 0,
    avgGap: 0,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('smaShort', 'SMA', this.settings.sma.shortWindowLength);
  this.addIndicator('smaLong', 'SMA', this.settings.sma.longWindowLength);

  this.addIndicator('ema', 'EMA', this.settings.ema.weight);
  this.addIndicator('macd', 'MACD', this.settings);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var smaShort = this.indicators.smaShort;
  var smaLong = this.indicators.smaLong;
  var ema = this.indicators.ema;
  var macd = this.indicators.macd;

  const price = candle.close;

  var diff = 0;

  if (smaShort.result > smaLong.result) {

    if (this.trend.direction != 'up') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        diff: 0,
        avgGap: 0,
        adviced: false
      };
    }

    this.trend.duration++;
    diff = smaShort.result - smaLong.result;

    if (this.trend.duration > 1) {
      this.trend.avgGap = ((diff - this.trend.diff) + this.trend.avgGap) / (this.trend.duration - 1);
    }

    log.debug('In uptrend since', this.trend.duration, 'candle(s) - diff: ', diff, ' avgGap: ', this.trend.avgGap);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.trend.diff > diff + this.trend.avgGap) {
        this.advice('short');
        this.trend.adviced = true;
        log.debug('TREND UP   >>>>>> CANDLE: H', candle.high, ' C', candle.close, ' O', candle.open, ' L', candle.low);
        log.debug(' sma   result = ', this.trend.diff, ' short = ', smaShort.result, ' long: ', smaLong.result );
        log.debug(' ema   result = ', ema.result);
        log.debug(' macd  result = ', macd.result);
      } else {
        this.trend.diff = diff;
      }
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
        diff: 0,
        avgGap: 0,
        adviced: false
      };
    }

    this.trend.duration++;
    diff = smaLong.result - smaShort.result;

    if (this.trend.duration > 1) {
      this.trend.avgGap = ((diff - this.trend.diff) + this.trend.avgGap) / (this.trend.duration - 1);
    }

    log.debug('In downtrend since', this.trend.duration, 'candle(s) - diff: ', diff, ' avgGap: ', this.trend.avgGap);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.trend.diff > diff + this.trend.avgGap) {
        this.advice('long');
        this.trend.adviced = true;

        log.debug('TREND DOWN >>>>>> CANDLE: H', candle.high, ' C', candle.close, ' O', candle.open, ' L', candle.low);
        log.debug(' sma   result = ', this.trend.diff, ' short = ', smaShort.result, ' long: ', smaLong.result );
        log.debug(' ema   result = ', ema.result);
        log.debug(' macd  result = ', macd.result);
      } else {
        this.trend.diff = diff;
      }
    } else
      this.advice();
  }
}

module.exports = method;
