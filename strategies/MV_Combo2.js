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

  this.candles = [];
  this.candleMinSize = 10; // TODO: param
  this.candleHistorySize = 50; // TODO: param

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

  log.debug('** Candle', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
    ' C', candle.close.toFixed(d),
    ' O', candle.open.toFixed(d),
    ' H', candle.high.toFixed(d),
    ' L', candle.low.toFixed(d));

  this.candles.push(Object.assign({}, candle));

  if (this.candles.length < this.candleMinSize) {
    log.debug('  ======================== LOADING');
    this.candles.push(candle);
    return
  }

  /*var ema = this.indicators.ema.result;
  var emaDiff = this.lastData.ema ? ema - this.lastData.ema : 0;
  var macd = this.indicators.macd.result;
  var macdShort = this.indicators.macd.short.result;
  var macdLong = this.indicators.macd.long.result;
  var macdDiff = this.lastData.macd ? macd - this.lastData.macd : 0;
  var signal = this.indicators.macd.signal.result;
  var signalDiff = this.lastData.signal ? signal - this.lastData.signal : 0;
  */

  var d = 4;
  var lastCandle = this.candles[this.candles.length - 1];

  var tmpCandles = [];

  for (let i = this.candles.length - this.candleMinSize; i < this.candles.length; i++) {
    tmpCandles.push(this.candles[i]);
  }

  var blendedCandle = cs.blendCandles(tmpCandles);

  if (cs.isBullish(blendedCandle)) {
    if (cs.isHammer(candle)) {
      this.advice('long');
      this.trend.adviced = true;
      this.pl -= candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isGravestone(candle)) {
      this.advice('long');
      this.trend.adviced = true;
      this.pl -= candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isInvertedHammer(candle)) {
      this.advice('long');
      this.trend.adviced = true;
      this.pl -= candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isDoji(candle)) {

      // TODO: Long-Legged Doji or cross or short wick, long wick

      log.debug('  ======================== NO ACTION isDoji Bullish');
    }
  } else if (cs.isBearish(blendedCandle)) {
    if (cs.isHangingMan(lastCandle, candle)) {
      this.advice('short');
      this.trend.adviced = true;
      this.pl += candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isGravestone(candle)) {
      this.advice('short');
      this.trend.adviced = true;
      this.pl += candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isGravestone ', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isShootingStar(lastCandle, candle)) {
      this.advice('short');
      this.trend.adviced = true;
      this.pl += candle.close;
      log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl);
    } else if (cs.isDoji(candle)) {

      // TODO: Long-Legged Doji or cross or short wick, long wick

      if (cs.isBullish(candle) && cs.isBearish(blendedCandle)) {
        this.advice('short');
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isDoji ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isBearish(candle) && cs.isBearish(blendedCandle)) {
        this.advice();
        log.debug('  ======================== NO ACTION isDoji Bearish');
      } else {
        // TODO: handle real doji
      }
    } else {
      log.debug('  ======================== NO ACTION');
      this.advice();
    }

  } else {
    // Undecided
    log.debug('  ======================== UNDECIDED');
  }

  this.candles.push(candle);

  if (this.candles.length == this.candleHistorySize) {
    this.candles.splice(0, Math.floor(this.candleHistorySize/2));
    log.debug('  ======================== REDUCED SIZE');
  }

  return






  if (cs.isBullish(blendedCandle)) {
    log.debug("++ BULL: ", blendedCandle);

    if (this.trend.direction != 'up') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };
    }

    this.trend.duration++;

    log.debug(' +  Uptrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' macd ', macd > 0 ? ' ': '', macd.toFixed(d), macdDiff > 0 ? ' ': '', macdDiff.toFixed(d),
      ' short ', macdShort > 0 ? ' ': '', macdShort.toFixed(d),
      ' long ', macdLong > 0 ? ' ': '', macdLong.toFixed(d),
      ' signal ', signal > 0 ? ' ': '', signal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ':'', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      if (cs.isHangingMan(lastCandle, candle)) {
        this.advice('short');
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isGravestone(candle)) {
        this.advice('short');
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isGravestone ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isShootingStar(lastCandle, candle)) {
        this.advice('short');
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isDoji(candle)) {
        // TODO: Long-Legged Doji or cross or short wick, long wick

        var dummy = 100 * Math.min(candle.open, candle.close) / Math.max(candle.open, candle.close);
        log.debug('dummy: ', dummy);

        this.advice('short');
        this.trend.adviced = true;
        this.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isDoji ', candle.close.toFixed(d), 'pl:', this.pl);
      }
    } else {
      this.advice();
    }

  } else if (cs.isBearish(blendedCandle)) {
    log.debug("--BEAR: ", blendedCandle);

    if (this.trend.direction != 'down') {
      //isAdviced = !(this.trend.direction == 'none' || this.trend.adviced);

      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        //adviced: isAdviced
        adviced: false
      };
    }

    this.trend.duration++;

    log.debug('- Downtrend since', this.trend.duration < 10 ? ' ' : '', this.trend.duration, 'candle(s) -',
      ' macd ', macd > 0 ? ' ': '', macd.toFixed(d), macdDiff > 0 ? ' ': '', macdDiff.toFixed(d),
      ' short ', macdShort > 0 ? ' ': '', macdShort.toFixed(d),
      ' long ', macdLong > 0 ? ' ': '', macdLong.toFixed(d),
      ' signal ', signal > 0 ? ' ': '', signal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ':'', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      if (cs.isHammer(candle)) {
        this.advice('long');
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isGravestone(candle)) {
        this.advice('long');
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone', candle.close.toFixed(d), 'pl:', this.pl);
      } else if (cs.isInvertedHammer(candle)) {
        this.advice('long');
        this.trend.adviced = true;
        this.pl -= candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl);
      }
    } else if (cs.isDoji(blendedCandle)) {
      this.advice();
      log.debug("Doji: ", blendedCandle);
    } else {
      this.advice();
    }
  }

  this.candles.push(Object.assign({}, candle));

  if (this.candles.length == this.candleHistorySize) {
    this.candles.shift();
  }

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
