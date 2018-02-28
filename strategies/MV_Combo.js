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

  this.lastData = {
    candle: null,
    ema: 0,
    emaDiff: 0,
    macd: 0,
    macdSignal: 0,
    pl: 0
  }

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  //this.addIndicator('smaShort', 'SMA', this.settings.sma.shortWindowLength);
  //this.addIndicator('smaLong', 'SMA', this.settings.sma.longWindowLength);

  this.addIndicator('ema', 'EMA', this.settings.ema.weight);
  this.addIndicator('macd', 'MACD', this.settings.macd);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  //var smaShort = this.indicators.smaShort;
  //var smaLong = this.indicators.smaLong;
  var ema = this.indicators.ema;
  var macd = this.indicators.macd;

  const price = candle.close;

  var d = 4;

  var emaDiff = ema.result - this.lastData.ema;
  var macdDiff = (this.lastData.macd) ? macd.result - this.lastData.macd : 0;

  if (macd.result > 0) {
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

    log.debug('+   Uptrend since', this.trend.duration < 10 ? ' ':'', this.trend.duration, 'candle(s) -',
      ' macd ', macd.result > 0 ? ' ': '', macd.result.toFixed(d), macdDiff > 0 ? ' ': '', macdDiff.toFixed(d),
      ' macd-signal ', macd.signal.result > 0 ? ' ': '', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d), emaDiff > 0 ? ' ':'', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (macd.signal.result > 1.0) {
        this.advice('short');
        this.trend.adviced = true;
        this.lastData.pl += candle.close;
        log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by Signal 1.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
      } else if (macd.signal.result < -1.0 && macd.signal.result > -2.0) {
        if (this.trend.duration <= 5) {
          if (emaDiff < this.lastData.emaDiff) {
            this.advice('short');
            this.trend.adviced = true;
            this.lastData.pl += candle.close;
            log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by Signal -1.0 EMA', candle.close.toFixed(d), 'pl:', this.lastData.pl);
          }
        }
      }
    } else {
      this.advice();
    }

  } else if (macd.result < 0) {
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
      ' macd ', macd.result > 0 ? ' ' : '', macd.result.toFixed(d), macdDiff > 0 ? ' ' : '', macdDiff.toFixed(d),
      ' macd-signal ', macd.signal.result > 0 ? ' ' : '', macd.signal.result.toFixed(d),
      ' ema ', ema.result.toFixed(d), emaDiff > 0 ? ' ' : '', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      if (macd.signal.result > 1.0 && macd.signal.result < 2.0 && this.trend.duration > 5) {
        if (emaDiff > this.lastData.emaDiff) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal 1.0-2.0 emaDiff < 0 ', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (macd.signal.result < -1.0 && macd.signal.result > -2.0) { // kinda side way
        if (macd.signal.result >= -1.5) {
          if (emaDiff > this.lastData.emaDiff && macd.signal.result * 2.0 < macd.result) {
            this.advice('long');
            this.trend.adviced = true;
            this.lastData.pl -= candle.close;
            log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal -1.5', candle.close.toFixed(d), 'pl:', this.lastData.pl);
          }
        }
      } else if (macd.signal.result <= -15.0) { // Way too down
        if (emaDiff > this.lastData.emaDiff) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal -15.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (this.trend.duration < 5) {
        if ((macd.signal.result < 0 && this.lastData.macdSignal < 0 && macd.signal.result < this.lastData.macdSignal * 2) ||
            (macd.signal.result > 0 && this.lastData.macdSignal > 0 && macd.signal.result * 2 < this.lastData.macdSignal)) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal 2X', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else {
        this.advice();
      }
    }
  }

  this.lastData.candle = candle;
  this.lastData.ema = ema.result;
  this.lastData.emaDiff = emaDiff;
  this.lastData.macd = macd.result;
  this.lastData.macdSignal = macd.signal.result;
}

module.exports = method;
