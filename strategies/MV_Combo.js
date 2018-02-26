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

  this.price = 0;
  this.ema = 0;
  this.avgEma = 0;


  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('smaShort', 'SMA', this.settings.sma.shortWindowLength);
  this.addIndicator('smaLong', 'SMA', this.settings.sma.longWindowLength);

  this.addIndicator('ema', 'EMA', this.settings.ema.weight);
  this.addIndicator('macd', 'MACD', this.settings.macd);
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
  var d = 4;

  if (this.price == 0) {
    this.price = price;
  } else if (price > this.price) {

    if (this.trend.direction != 'up') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };
    }

    this.trend.duration++;

    log.debug('+   Uptrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' macd ', macd.result > 0 ? ' ': '', macd.result.toFixed(d),
      ' macd-signal ', macd.signal.result > 0 ? ' ': '', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d),'-', this.ema.toFixed(d),'=', (ema.result - this.ema) > 0 ? ' ':'', (ema.result - this.ema).toFixed(d),
      ' H', candle.high.toFixed(d), ' C', candle.close.toFixed(d), ' O', candle.open.toFixed(d), ' L', candle.low.toFixed(d));

  } else if (price < this.price) {

    if (this.trend.direction != 'down') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };
    }

    this.trend.duration++;

    log.debug('- Downtrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' macd ', macd.result > 0 ? ' ': '', macd.result.toFixed(d),
      ' macd-signal ', macd.signal.result > 0 ? ' ': '', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d),'-', this.ema.toFixed(d),'=', (ema.result - this.ema) > 0 ? ' ':'', (ema.result - this.ema).toFixed(d),
      ' H', candle.high.toFixed(d), ' C', candle.close.toFixed(d), ' O', candle.open.toFixed(d), ' L', candle.low.toFixed(d));
  }

  this.price = price;
  this.ema = ema.result;

  return

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

    log.debug('In uptrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' diff: ', diff.toFixed(d),
      ' macd ', macd.result.toFixed(d),
      ' macd signal ', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d),
      ' avgGap: ', this.trend.avgGap.toFixed(d),
      ' C', price);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.trend.diff > diff + this.trend.avgGap) {
        this.advice('short');
        this.trend.adviced = true;
        log.debug('TREND UP   >>>>>> CANDLE: H', candle.high, ' C', candle.close, ' O', candle.open, ' L', candle.low);
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

    log.debug('In downtrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' diff: ', diff.toFixed(d),
      ' macd ', macd.result.toFixed(d),
      ' macd signal ', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d),
      ' avgGap: ', this.trend.avgGap.toFixed(d),
      ' C', price);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.trend.diff > diff + this.trend.avgGap) {
        this.advice('long');
        this.trend.adviced = true;

        log.debug('TREND DOWN >>>>>> CANDLE: H', candle.high, ' C', candle.close, ' O', candle.open, ' L', candle.low);
      } else {
        this.trend.diff = diff;
      }
    } else
      this.advice();
  }
}

module.exports = method;
