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
  //this.name = 'MV_Combo';

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

  var ema = ema.result;
  var emaDiff = ema - this.lastData.ema;
  var macdResult = macd.result;
  var macdSignal = macd.signal.result;
  var macdDiff = (this.lastData.macd) ? macdResult - this.lastData.macd : 0;

  if (macdResult > 0) {
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
      ' macd ', macdResult > 0 ? ' ': '', macdResult.toFixed(d), macdDiff > 0 ? ' ': '', macdDiff.toFixed(d),
      ' macd-signal ', macdSignal > 0 ? ' ': '', macdSignal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ':'', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.trend.duration > 15) {
        if (this.trend.duration > 15 && emaDiff < this.lastData.emaDiff) {
          this.advice('short');
          this.trend.adviced = true;
          this.lastData.pl += candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by Duration >15', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (macdSignal > 1.0 && macdSignal < 2.0 && this.trend.duration > 5 && this.trend.duration < 15) {
        if (emaDiff < this.lastData.emaDiff) {
          this.advice('short');
          this.trend.adviced = true;
          this.lastData.pl += candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by Signal 1.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (macdSignal > 2.0) {
        if (macdSignal < this.lastData.macdSignal || (this.trend.duration > 15 && macdDiff < 0)) {
          this.advice('short');
          this.trend.adviced = true;
          this.lastData.pl += candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> SELL SELL SELL by Signal >2.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (macdSignal < -1.0 && macdSignal > -2.0) {
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

  } else if (macdResult < 0) {
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
      ' macd ', macdResult > 0 ? ' ' : '', macdResult.toFixed(d), macdDiff > 0 ? ' ' : '', macdDiff.toFixed(d),
      ' macd-signal ', macdSignal > 0 ? ' ' : '', macdSignal.toFixed(d),
      ' ema ', ema.toFixed(d), emaDiff > 0 ? ' ' : '', emaDiff.toFixed(d),
      ' C', candle.close.toFixed(d),
      ' O', candle.open.toFixed(d),
      ' H', candle.high.toFixed(d),
      ' L', candle.low.toFixed(d));

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      if (macdSignal > 1.0 && macdSignal < 2.0 && this.trend.duration > 5) {
        if (emaDiff > this.lastData.emaDiff) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal 1.0-2.0 emaDiff < 0 ', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (macdSignal < -1.0 && macdSignal > -2.0) { // kinda side way
        if (macdSignal >= -1.5 && this.trend.duration <= 15) {
          if (emaDiff > this.lastData.emaDiff && macdSignal * 2.0 < macdResult + macdDiff) {
            this.advice('long');
            this.trend.adviced = true;
            this.lastData.pl -= candle.close;
            log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal -1.5', candle.close.toFixed(d), 'pl:', this.lastData.pl);
          }
        }
      } else if (macdSignal <= -15.0) { // Way too down
          if (emaDiff > this.lastData.emaDiff) {
            this.advice('long');
            this.trend.adviced = true;
            this.lastData.pl -= candle.close;
            log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal -15.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
          }
      } else if (macdSignal >= 2.0 && this.trend.duration > 15 && emaDiff > this.lastData.emaDiff) { // Way too down
        if (emaDiff > this.lastData.emaDiff) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal -15.0', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      } else if (this.trend.duration < 5) {
        if ((macdSignal < 0 && this.lastData.macdSignal < 0 && macdSignal < this.lastData.macdSignal * 2) ||
            (macdSignal > 0 && this.lastData.macdSignal > 0 && macdSignal * 2 < this.lastData.macdSignal)) {
          this.advice('long');
          this.trend.adviced = true;
          this.lastData.pl -= candle.close;
          log.debug('  >>>>>>>>>>>>>>>>>>>>>>>> BUY BUY BUY Signal 2X', candle.close.toFixed(d), 'pl:', this.lastData.pl);
        }
      }
    } else {
      this.advice();
    }
  }

  this.lastData.candle = candle;
  this.lastData.ema = ema;
  this.lastData.emaDiff = emaDiff;
  this.lastData.macd = macdResult;
  this.lastData.macdSignal = macdSignal;
}

module.exports = method;
