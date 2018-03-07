/*

 Combo2 strategy - maxvuong 2018-02-28

 */

var _ = require('lodash');
var log = require('../core/log.js');
const cs = require('../core/candlestick.js');

const d = 4;

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
    lastAdvice: this.settings.init.lastAdvice,
    preservedCandle: false,
    signal: {
      hold: false,
      until: null,
      confirm: null,
      persistence: 0
    }
  }

  this.history = {
    candles: [],
    age: 0,
    candleMinSize: this.settings.init.persistence || 1,
    maxSize: this.settings.init.maxSize || 100
  }

  this.resistanceIdx = -1;
  this.supportIdx = -1;
  this.resistancePrice = 0;
  this.supportPrice = Infinity;

  this.pl = 0;

  //this.requiredHistory = this.tradingAdvisor.historySize;
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  log.debug('          ** Candle', this.history.age < 10 ? ' ':'', this.history.age, 'candle(s) -',
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

  if (this.history.candles.length <= this.history.candleMinSize) {
    log.debug('  ======================== LOADING');
    return
  }

  var lastCandle = this.getLastCandle();

  /*
   Signal & Confirm signal
   */
  if (this.trend.signal.hold) {
    if (!this.trend.signal.until) {
      //this.trend.signal.persistence--; // TODO:

      //if (this.trend.signal.persistence < 0) {

      //}

      /*if (this.trend.signal.confirm == 'up') {
        if (cs.isBullish(candle)) {
          if (this.trend.lastAdvice == 'long') {

          } else if (this.trend.lastAdvice == 'short') {

          }
        } else {

        }
      } else if (this.trend.signal.confirm == 'down') {
        if (cs.isBearish(candle)) {
          if (this.trend.lastAdvice == 'long') {

          } else if (this.trend.lastAdvice == 'short') {

          }
        } else {

        }
      }*/

      //this.resetTrendSignal();
    }

    if (this.trend.signal.until(candle)) {
      this.trend.signal.until = null;
      log.debug("Until is executed");
    }

    /*if (this.trend.signal.until == 'up' && cs.isBullish(candle) || (this.trend.signal.until == 'down' && cs.isBearish(candle))) {
      this.trend.signal.until = null;
    }*/
  }

  /*
    Single candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isHangingMan(lastCandle, candle)) {
        this.setTrend('short', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      } else if (cs.isShootingStar(lastCandle, candle)) {
        this.setTrend('short', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      } else if (cs.isBearishLongTail(lastCandle, candle)) {
        this.setTrend('short', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isBearishLongTail ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isHammer(candle)) {
        this.setTrend('long', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      } else if (cs.isInvertedHammer(candle)) {
        this.setTrend('long', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
    Multiple candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isGravestone(candle) && cs.isBullish(lastCandle)) {
        this.setTrend('short', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isGravestone(candle) && cs.isBearish(lastCandle)) {
        this.setTrend('long', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
   Engulf patterns
   */
  /*if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isBearishHarami(lastCandle, candle)) {
        this.setTrend('short', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isBearishHarami', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isBearishHarami(lastCandle, candle)) {
        this.setTrend('long', true);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isBearishHarami', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }*/

  /*
    Trend percentage check by duration
   */
  if (!this.trend.adviced) {
    var trendByDuration = this.getTrendCandles();

    if (trendByDuration.length) {
      var b = cs.blendCandles(trendByDuration);
      var p = cs.calculateBodyPercentage(b);

      log.debug("   -------- b", b, 'duration', this.trend.duration, "length", trendByDuration.length, 'percent growth', p);

      if (cs.isBullish(b)) {
        if (p > 0.40) {               // TODO: param or AI about this
        //if (this.resistanceIdx) {
          //this.setTrend('short', true);
          //log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL Duration #1', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
        }
      } else if (cs.isBearish(b)) {
        if (p >= 1.0) {               // TODO: param or AI about this
          this.setTrendSignal(true, cs.isBullish, cs.isBearish, 1);
        }
      }
    }
  }

  /*
   Take action if adviced
   */
  if (this.trend.adviced) {
    this.advice(this.trend.lastAdvice);
    this.resetTrend();
  } else {
    this.advice();
  }
}

/*
 Long term trend operations
 */
method.addCandle = function(candle) {
  this.history.candles[this.history.age] = candle;
  //this.history.candles[this.history.age] = Object.assign({}, candle);

  if (candle.close < this.supportPrice)
    this.supportIdx = this.history.age;

  if (candle.close > this.resistancePrice)
    this.resistanceIdx = this.history.age;

  this.history.age = (this.history.age + 1) % this.history.maxSize;
}

method.getLastCandle = function() {
  if (this.history.candles.length < 2)
    return null;

  return this.history.age > 1 ? this.history.candles[this.history.age - 2] : this.history.candles[this.history.candles.length + (this.history.age - 2)];
}

/*
  Short term trend operations
 */
method.addTrendCandle = function(candle) {
  this.trend.candles.push(candle)
}

method.getTrendCandles = function() {
  return this.trend.candles;
}

method.setTrend = function(lastAdvice, preservedCandle) {
  this.trend.lastAdvice = lastAdvice;
  this.trend.preservedCandle = preservedCandle;
  this.trend.adviced = true;
}

method.resetTrend = function() {
  this.trend.duration = this.trend.preservedCandle ? 1 : 0;
  this.trend.candles.splice(0, this.trend.candles.length - this.trend.duration);
  this.trend.adviced = false;
}

method.setTrendSignal = function(hold, on, confirm, persistence) {
  this.trend.signal.hold = hold;
  this.trend.signal.until = on;
  this.trend.signal.confirm = confirm;
  this.trend.signal.persistence = persistence;
}

method.resetTrendSignal = function() {
  this.trend.signal.hold = false;
}

/*method.getTrendByDuration = function() {
  var candles = [];
  var index = this.history.age - this.trend.duration;
  index = index < 0 ? this.history.candles.length + index : index;

  for (let i = 0; i < this.trend.duration; i++) {
    candles.push(this.history.candles[index]);
    index = (index + 1) % this.history.candles.length;
  }

  return candles;
}*/

/*
method.updateSupportResistance = function () {
  if (this.history.age == this.supportIdx) {
    this.supportPrice = Infinity;

    for (let i = 0; i < this.history.candles.length; i++) {
      if (this.candle[this.history.age].close < this.supportPrice) {
        this.supportIdx = i;
      }
    }
  }

  if (this.history.age == this.resistanceIdx) {

  }
}
*/




// define the indicators we need
//this.addIndicator('ema', 'EMA', this.settings.ema.weight);
//this.addIndicator('macd', 'MACD', this.settings.macd);
//this.addIndicator('rsi', 'RSI', this.settings.rsi);

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


/*var ema = this.indicators.ema.result;
 var emaDiff = this.lastData.ema ? ema - this.lastData.ema : 0;
 var macd = this.indicators.macd.result;
 var macdShort = this.indicators.macd.short.result;
 var macdLong = this.indicators.macd.long.result;
 var macdDiff = this.lastData.macd ? macd - this.lastData.macd : 0;
 var signal = this.indicators.macd.signal.result;
 var signalDiff = this.lastData.signal ? signal - this.lastData.signal : 0;
 */

/*this.lastData.ema = ema;
 this.lastData.emaDiff = emaDiff;
 this.lastData.macd = macd;
 this.lastData.macdShort = macdShort;
 this.lastData.macdLong = macdLong;
 this.lastData.macdDiff = macdDiff;
 this.lastData.signal = signal;
 this.lastData.signalDiff = signalDiff;
 */

module.exports = method;
