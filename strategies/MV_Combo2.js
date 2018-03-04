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

  this.candles = [];
  this.age = 0;

  this.candleMinSize = 1; // TODO: param
  this.candleHistorySize = 100; // TODO: param

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

  log.debug('          ** Candle', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
    ' C', candle.close.toFixed(d),
    ' O', candle.open.toFixed(d),
    ' H', candle.high.toFixed(d),
    ' L', candle.low.toFixed(d));

  /*
   Add candle and update support/resistance indexes
   */
  //this.addCandle(candle);

  //this.candle[this.age] = Object.assign({}, candle);
  this.candle[this.age] = candle;
  //this.updateSupportResistance();

  if (candle.close < this.supportPrice)
    this.supportIdx = this.age;

  if (candle.close > this.resistancePrice)
    this.resistanceIdx = this.age;

  this.age = (this.age + 1) % this.candleHistorySize;


  if (this.candles.length < this.candleMinSize) {
    log.debug('  ======================== LOADING');
    return
  }


  log.debug('  ======================== DONE LOADING');

  var lastCandle = this.getLastCandle();
  //var shortBlendedCandle = cs.blendCandles(this.getTrendCandles());


  //var tmpCandles = [];

  //for (let i = this.candles.length - this.candleMinSize; i < this.candles.length; i++) {
  //  tmpCandles.push(this.candles[i]);
  //}

  //var blendedCandle = cs.blendCandles(tmpCandles);

  this.trend.duration++;

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
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isGravestone(candle) && cs.isBearish(lastCandle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl);
      }
    }




    /*if (false && cs.isBearish(blendedCandle)) {
      if (cs.isHammer(candle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isGravestone(candle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isInvertedHammer(candle)) {
        this.trend.lastAdvice = 'long';
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isDoji(candle)) {

        // TODO: Long-Legged Doji or cross or short wick, long wick

        log.debug('  ======================== NO ACTION isDoji Bullish');
      }
    } else if (false && cs.isBullish(blendedCandle)) {
      if (cs.isHangingMan(lastCandle, candle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isGravestone(candle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isGravestone ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isShootingStar(lastCandle, candle)) {
        this.trend.lastAdvice = 'short';
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isDoji(candle)) {

        // TODO: Long-Legged Doji or cross or short wick, long wick

        if (cs.isBullish(candle) && cs.isBearish(blendedCandle)) {
          this.trend.lastAdvice = 'short';
          this.trend.adviced = true;
          this.pl += candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isDoji ', candle.close.toFixed(d), 'pl:', this.pl);
        } else if (cs.isBearish(candle) && cs.isBearish(blendedCandle)) {
          this.advice();
          log.debug('  ======================== NO ACTION isDoji Bearish');
        } else {
          // TODO: handle real doji
        }
      }
    } else {
      // Undecided
      //log.debug('  ======================== UNDECIDED');
    }*/
  }

  /*
   Take action if adviced
   */
  if (this.trend.adviced) {
    this.advice(this.trend.lastAdvice);
  } else {
    this.advice();
  }

  /*
    Reinitialize trend
   */
  this.trend.adviced = false;
  this.trend.duration = 0;

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
method.addCandle = function(candle) {
  this.candle[this.age] = Object.assign({}, candle);
  //this.updateSupportResistance();

  if (candle.close < this.supportPrice)
    this.supportIdx = this.age;

  if (candle.close > this.resistancePrice)
    this.resistanceIdx = this.age;

  this.age = (this.age + 1) % this.candleHistorySize;
}

method.getLastCandle = function() {
  if (this.candles.length > 1)
    return null;

  return this.age > 1 ? this.candles[this.age - 2] : this.candles[this.candles.length + (this.age - 2)];
}
*/
method.getTrendCandles = function() {
  return [];
}

/*
method.updateSupportResistance = function () {
  if (this.age == this.supportIdx) {
    this.supportPrice = Infinity;

    for (let i = 0; i < this.candles.length; i++) {
      if (this.candle[this.age].close < this.supportPrice) {
        this.supportIdx = i;
      }
    }
  }

  if (this.age == this.resistanceIdx) {

  }
}
*/

module.exports = method;
