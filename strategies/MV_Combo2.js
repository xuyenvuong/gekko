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
    keep: 0,
    signal: {
      hold: false,
      state: 'wait',
      wait: null,
      confirm: null,
      until: null
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
  var trendByDuration = this.getTrendCandles();
  var b = cs.blendCandles(trendByDuration);
  var p = cs.calculateBodyPercentage(b);

  /*
   Signal & Confirm signal
   */
  if (this.trend.signal.hold) {
    var stageTransition = false;

    if (this.trend.signal.state == 'wait' && this.trend.signal.wait.on(candle)) {
      this.trend.signal.state = this.trend.signal.wait.do;
      log.debug("  <------- Until WAIT is executed");
      stageTransition = true;
    }

    if (!stageTransition && this.trend.signal.state == 'confirm') {
      this.trend.signal.until.wait--;

      if (this.trend.signal.confirm.on(candle)) {
        this.setTrend(this.trend.signal.confirm.do, this.trend.signal.confirm.keep);

        if (this.trend.signal.confirm.do == 'long') {
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY signal', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
        } else {
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL signal', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
        }
      }

      if (this.trend.signal.until.wait == 0) {
        if (this.trend.signal.until.do != 'hold') {
          this.setTrend(this.trend.signal.until.do, 0);
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SIGNAL SIGNAL expired', this.trend.signal.until.do, candle.close.toFixed(d));
        } else
          this.resetTrendSignal();
      }
    }
  }

  /*
    Single candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isHangingMan(lastCandle, candle)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isHangingMan ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      } else if (cs.isShootingStar(lastCandle, candle)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isShootingStar ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      } else if (cs.isBearishLongTail(lastCandle, candle)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by isBearishLongTail ', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isHammer(candle)) {
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isHammer', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      } else if (cs.isInvertedHammer(candle)) {
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isInvertedHammer', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
    Doji & trend
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isDoji(candle) && cs.isBullish(lastCandle) && cs.isBullish(b) && p > 0.4) { // TODO: update p
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL Doji #1', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isDoji(candle) && cs.isBearish(lastCandle) && cs.isBearish(b) && p > 0.4) { // TODO: update p
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Doji #1', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
    Multiple candle patterns
   */
  if (!this.trend.adviced) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isGravestone(candle) && cs.isBullish(lastCandle)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isGravestone(candle) && cs.isBearish(lastCandle)) {
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isGravestone #2', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
   Engulf patterns
   */
  if (!this.trend.adviced && !this.trend.signal.hold) {
    if (this.trend.lastAdvice == 'long') {
      if (cs.isBearishHarami(lastCandle, candle) && cs.isBearish(b)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isBearishHarami', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      } else if (cs.isBullishHarami(lastCandle, candle) && cs.isBullish(b)) {
        this.setTrend('short', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL isBullishHarami', candle.close.toFixed(d), 'pl:', this.pl += candle.close);
      }
    } else if (this.trend.lastAdvice == 'short') {
      if (cs.isBearishHarami(lastCandle, candle) && cs.isBullish(b)) {
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isBearishHarami', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      } else if (cs.isBullishHarami(lastCandle, candle) && cs.isBearish(b)) {
        this.setTrend('long', 1);
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY isBullishHarami', candle.close.toFixed(d), 'pl:', this.pl -= candle.close);
      }
    }
  }

  /*
    Trend percentage check by duration
   */
  if (!this.trend.adviced && !this.trend.signal.hold) {
    log.debug("   -------- b", b, 'duration', this.trend.duration, "length", trendByDuration.length, 'percent growth', p);

    if (cs.isBullish(b)) {
      if (p >= 0.4) {               // TODO: param or AI about this
        this.setTrendSignal({
          on: cs.isBearish,
          do: 'confirm'
        }, {
          on: cs.isBearish,
          do: 'short',
          keep: 2
        }, {
          wait: 1,
          do: 'hold'
        });
      }
    } else if (cs.isBearish(b)) {
      if (p >= 0.4) {               // TODO: param or AI about this
        this.setTrendSignal({
          on: cs.isBullish,
          do: 'confirm'
        }, {
          on: cs.isBullish,
          do: 'long',
          keep: 2
        }, {
          wait: 1,
          do: 'hold'
        });
      }
    }
  }

  /*
   Take action if adviced
   */
  if (this.trend.adviced) {
    this.advice(this.trend.lastAdvice);
    this.resetTrend();
  } else
    this.advice();
}

/*
 Long term trend operations
 */
method.addCandle = function(candle) {
  this.history.candles[this.history.age] = candle;

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

method.setTrend = function(lastAdvice, keep) {
  this.trend.adviced = true;
  this.trend.lastAdvice = lastAdvice;
  this.trend.keep = keep;

  this.resetTrendSignal();
}

method.resetTrend = function() {
  this.trend.duration = this.trend.keep;
  this.trend.candles.splice(0, this.trend.candles.length - this.trend.duration);
  this.trend.adviced = false;
}

method.setTrendSignal = function(wait, confirm, until) {
  this.trend.signal.hold = true;
  this.trend.signal.state = 'wait';
  this.trend.signal.wait = wait;
  this.trend.signal.confirm = confirm;
  this.trend.signal.until = until;
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
