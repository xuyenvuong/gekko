/*

 Combo2 strategy - maxvuong 2018-02-28

 */

var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.input = 'candle';
  this.name = 'MV_Combo2';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.lastData = {
    candle: null,
    ema: 0,
    emaDiff: 0,
    macd: 0,
    macdShort: 0,
    macdLong: 0,
    macdDiff: 0,
    signal: 0,
    signalDiff: 0
  }

  this.pl = 0;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ema', 'EMA', this.settings.ema.weight);
  this.addIndicator('macd', 'MACD', this.settings.macd);
  //this.addIndicator('rsi', 'RSI', this.settings.rsi);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var ema = this.indicators.ema.result;
  var emaDiff = this.lastData.ema ? ema - this.lastData.ema : 0;
  var macd = this.indicators.macd.result;
  var macdShort = this.indicators.macd.short;
  var macdLong = this.indicators.macd.long;
  var macdDiff = this.lastData.macd ? macd - this.lastData.macd : 0;
  var signal = this.indicators.macd.signal.result;
  var signalDiff = this.lastData.signal ? signal - this.lastData.signal : 0;

  var d = 4;

  if (macd > 0) {
    if (this.trend.direction != 'up') {
      var isAdviced = !(this.trend.direction == 'none' || this.trend.adviced);

      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: isAdviced
      };
    }

    this.trend.duration++;

    log.debug(' +  Uptrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' macd ', macd > 0 ? ' ': '', macd.toFixed(d), macdDiff > 0 ? ' ': '', macdDiff.toFixed(d),
      ' short ', macdShort > 0 ? ' ': '', macdShort.toFixed(d),
      ' short ', macdLong > 0 ? ' ': '', macdLong.toFixed(d),
      ' signal ', signal > 0 ? ' ': '', signal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ':'', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {

    } else {
      this.advice();
    }

  } else if (macd < 0) {
    if (this.trend.direction != 'down') {
      var isAdviced = !(this.trend.direction == 'none' || this.trend.adviced);

      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: isAdviced
      };
    }

    this.trend.duration++;

    log.debug('- Downtrend since', this.trend.duration < 10 ? ' ' : '', this.trend.duration, 'candle(s) -',
      ' macd ', macd > 0 ? ' ' : '', macd.toFixed(d), macdDiff > 0 ? ' ' : '', macdDiff.toFixed(d),
      ' macd-signal ', macdSignal > 0 ? ' ' : '', macdSignal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ' : '', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {

    } else {
      this.advice();
    }
  }

  this.lastData.candle = candle;
  this.lastData.ema = ema;
  this.lastData.emaDiff = emaDiff;
  this.lastData.macd = macd;
  this.lastData.macdShort = macdShort;
  this.lastData.macdLong = macdLong;
  this.lastData.macdDiff = macdDiff;
  this.lastData.signal = signal;
  this.lastData.signalDiff = signalDiff;
}

module.exports = method;
