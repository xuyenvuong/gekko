/*

 BB strategy - okibcn 2018-01-03

 */
// helpers

const helper = require('../core/helper.js');
var _ = require('lodash');
var log = require('../core/log.js');
var BB = require('./indicators/BB.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'BB_Stoploss';
  this.nsamples = 0;
  this.trend = {
    zone: 'none',  // none, top, high, low, bottom
    duration: 0,
    persisted: false
  };

  this.stopLoss = helper.trailingStopLoss();
  this.stopLoss.percentage = this.settings.trailingStop.percentage;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('bb', 'BB', this.settings.bbands);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var BB = this.indicators.bb;
  //BB.lower; BB.upper; BB.middle are your line values

  log.debug('______________________________________');
  log.debug('calculated BB properties for candle ',this.nsamples);

  if (BB.upper > candle.close)  log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  if (BB.middle > candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  if (BB.lower >= candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));

  log.debug('\t', 'price:', candle.close.toFixed(digits));

  if (BB.upper <= candle.close)  log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  if (BB.middle <= candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  if (BB.lower < candle.close)   log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  log.debug('\t', 'Band gap: ', BB.upper.toFixed(digits) - BB.lower.toFixed(digits));
}

method.check = function(candle) {
  var BB = this.indicators.bb;
  var price = candle.close;
  this.nsamples++;

  const currentPrice = candle.close;

  if(this.stopLoss.isTriggered(currentPrice)) {
    this.advice('short');
    this.stopLoss.destroy();
  }

  // price Zone detection
  var zone = 'none';
  if (price >= BB.upper) zone = 'top';
  if ((price < BB.upper) && (price >= BB.middle)) zone = 'high';
  if ((price > BB.lower) && (price < BB.middle)) zone = 'low';
  if (price <= BB.lower) zone = 'bottom';
  log.debug('current zone:  ',zone);


  if (this.trend.zone == zone) {
    // Ain't no zone change
    log.debug('persisted');
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: this.trend.duration+1,
      persisted: true
    }

    this.stopLoss.update(currentPrice);
    this.advice();
  }
  else {
    // There is a zone change
    log.debug('Leaving zone: ',this.trend.zone)

    switch (this.trend.zone) {
      case 'top':
        this.advice('short');
        this.stopLoss.destroy();
        log.debug(   '>>>>>   SIGNALING ADVICE SHORT   <<<<<<<<<<<<');
        break;
      case 'bottom':
        this.stopLoss.create(this.stopLoss.percentage, currentPrice);
        this.advice('long');
        log.debug('>>>>>   SIGNALING ADVICE LONG    <<<<<<<<<<<<');
        break;
      case 'high':
      case 'low':
        this.stopLoss.update(currentPrice);
        this.advice();
        break;
      default:
        log.debug('>>>>>   UNKNOWN ZONE: '+ this.trend.zone +'    <<<<<<<<<<<<');
        break;
    }

    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: 0,
      persisted: false
    }
  }
}

module.exports = method;
