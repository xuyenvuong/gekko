/*

 Combo2 strategy - maxvuong 2018-02-28

 */

var _ = require('lodash');
var log = require('../core/log.js');
const cs = require('../core/candlestick.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.input = 'candle';
  this.name = 'MV_Combo2';

  this.trend = {
    direction: 'none',
    candles: [],
    duration: 0,
    persisted: false,
    adviced: false,
    lastAdvice: 'short' // TODO: param
  }

  /*this.lastData = {
    candle: null,
    ema: 0,
    emaDiff: 0,
    macd: 0,
    macdShort: 0,
    macdLong: 0,
    macdDiff: 0,
    signal: 0,
    signalDiff: 0
  }*/

  this.history = {
    candles: [],
    currentIdx: 0,
    candleMinSize: this.settings.thresholds.persistence || 1,
    maxSize: this.settings.thresholds.maxSize || 100
  }

  this.resistanceIdx = -1;
  this.supportIdx = -1;
  this.resistancePrice = 0;
  this.supportPrice = Infinity;

  this.pl = 0;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  //this.addIndicator('ema', 'EMA', this.settings.ema.weight);
  //this.addIndicator('macd', 'MACD', this.settings.macd);
  //this.addIndicator('rsi', 'RSI', this.settings.rsi);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var d = 4;

  /*var ema = this.indicators.ema.result;
   var emaDiff = this.lastData.ema ? ema - this.lastData.ema : 0;
   var macd = this.indicators.macd.result;
   var macdShort = this.indicators.macd.short.result;
   var macdLong = this.indicators.macd.long.result;
   var macdDiff = this.lastData.macd ? macd - this.lastData.macd : 0;
   var signal = this.indicators.macd.signal.result;
   var signalDiff = this.lastData.signal ? signal - this.lastData.signal : 0;
   */

  log.debug('          ** Candle', this.history.currentIdx < 10 ? ' ':'', this.history.currentIdx, 'candle(s) -',
    ' C', candle.close.toFixed(d),
    ' O', candle.open.toFixed(d),
    ' H', candle.high.toFixed(d),
    ' L', candle.low.toFixed(d));

  /*
   Add candle and update support/resistance indexes
   */
  this.addCandle(candle);
  this.addTrendCandle(candle);

  this.trend.duration++;

  if (this.history.candles.length < this.history.candleMinSize) {
    log.debug('  ======================== LOADING');
    return
  }

  var lastCandle = this.getLastCandle();
  var trendByDuration = this.getTrendCandles();

  /*
    Single candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isHangingMan(lastCandle, candle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isShootingStar(lastCandle, candle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isHammer(candle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isInvertedHammer(candle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl);
      }
    }
  }

  /*
    Multiple candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isGravestone(candle) && cs.isBullish(lastCandle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isGravestone(candle) && cs.isBearish(lastCandle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl);
      }
    }
  }

  /*
    Trend percentage check by duration
   */
  if (!this.trend.adviced) {
    if (trendByDuration.length) {
      var b = cs.blendCandles(trendByDuration);
      log.debug("   -------- b", b, "length", trendByDuration.length);

      if (cs.isBullish(b)) { // TODO: compare with long term trend before making decision
        var p = 100 * (b.close - b.open) / b.open;
        log.debug(' percent growth =', p);

        if (p > 0.45) { // TODO: param
          this.trend.lastAdvice = 'short';
          this.trend.adviced = true;
          this.pl += candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL Duration #1', candle.close.toFixed(d), 'pl:', this.pl);
        }
      }
    }
  }

  /*
   Take action if adviced
   */
  if (this.trend.adviced) {
    this.advice(this.trend.lastAdvice);
    this.trend.candles.splice(0, this.trend.candles.length);
    this.trend.duration = 0;

    /*if (this.trend.lastAdvice == 'long') {
      this.supportIdx = this.history.currentIdx == 0 ? this.history.currentIdx : this.history.candles.length - 1;
    } else if (this.trend.lastAdvice == 'short') {
      this.resistanceIdx = this.history.currentIdx == 0 ? this.history.currentIdx : this.history.candles.length - 1;
    }*/
  } else {
    this.advice();
  }

  /*
    Reinitialize trend
   */
  this.trend.adviced = false;

  return;

  /*this.lastData.ema = ema;
  this.lastData.emaDiff = emaDiff;
  this.lastData.macd = macd;
  this.lastData.macdShort = macdShort;
  this.lastData.macdLong = macdLong;
  this.lastData.macdDiff = macdDiff;
  this.lastData.signal = signal;
  this.lastData.signalDiff = signalDiff;
  */
}

/*
 Long term trend
 */
method.addCandle = function(candle) {
  this.history.candles[this.history.currentIdx] = candle;
  //this.history.candles[this.history.currentIdx] = Object.assign({}, candle);

  if (candle.close < this.supportPrice)
    this.supportIdx = this.history.currentIdx;

  if (candle.close > this.resistancePrice)
    this.resistanceIdx = this.history.currentIdx;

  this.history.currentIdx = (this.history.currentIdx + 1) % this.history.maxSize;
}

method.getLastCandle = function() {
  if (this.history.candles.length < 2)
    return null;

  return this.history.currentIdx > 1 ? this.history.candles[this.history.currentIdx - 2] : this.history.candles[this.history.candles.length + (this.history.currentIdx - 2)];
}

/*
  Trend operation
 */
method.addTrendCandle = function(candle) {
  this.trend.candles.push(candle)
}

method.getTrendCandles = function() {
  return this.trend.candles;
}


/*method.getTrendByDuration = function() {
  var candles = [];
  var index = this.history.currentIdx - this.trend.duration;
  index = index < 0 ? this.history.candles.length + index : index;

  for (let i = 0; i < this.trend.duration; i++) {
    candles.push(this.history.candles[index]);
    index = (index + 1) % this.history.candles.length;
  }

  return candles;
}*/

/*
method.updateSupportResistance = function () {
  if (this.history.currentIdx == this.supportIdx) {
    this.supportPrice = Infinity;

    for (let i = 0; i < this.history.candles.length; i++) {
      if (this.candle[this.history.currentIdx].close < this.supportPrice) {
        this.supportIdx = i;
      }
    }
  }

  if (this.history.currentIdx == this.resistanceIdx) {

  }
}
*/

module.exports = method;
