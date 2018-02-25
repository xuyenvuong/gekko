/*

 Trending strategy - maxvuong 2018-02-23

 */

//const helper = require('../core/helper.js');
var _ = require('lodash');
var log = require('../core/log.js');
var TRENDING = require('./indicators/TRENDING.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.input = 'candle';
  this.name = 'MV_Trending';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  //this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('trending', 'TRENDING', this.settings.trending);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
}

method.check = function(candle) {
  var TRENDING = this.indicators.trending;
  const price = candle.close;


  if (TRENDING.trend == 'up') {

    // new trend detected
    if(this.trend.direction !== 'up') {
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };
    }

    if (price >= TRENDING.stopBuy && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
      log.debug('>>>>> ADVICE LONG <<<<<<<<<<<<'+ 'Price: '+ price +' stopBuy: '+ TRENDING.stopBuy);
    } else {
      this.advice();
    }

  } else if (TRENDING.trend == 'down') {

    // new trend detected
    if(this.trend.direction !== 'down') {
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };
    }

    if (price <= TRENDING.stopLoss && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
      log.debug('>>>>> ADVICE SHORT <<<<<<<<<<<<'+ 'Price: '+ price +' stopLoss: '+ TRENDING.stopLoss);
    } else {
      this.advice()
    }
  }

  /*

  return;

  // price Zone detection
  var zone = 'none';

  if (price >= BB.upper) zone = 'top';
  if ((price < BB.upper) && (price >= BB.middle)) zone = 'high';
  if ((price > BB.lower) && (price < BB.middle)) zone = 'low';
  if (price <= BB.lower) zone = 'bottom';

  log.debug('current zone:  ', zone);

  if (this.trend.zone == zone) {
    // Ain't no zone change
    log.debug('persisted');
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: this.trend.duration + 1,
      persisted: true
    };

    this.advice();
  } else {
    // There is a zone change
    log.debug('Leaving zone: ', this.trend.zone)

    switch (this.trend.zone) {
      case 'top':
        this.advice('short');
        this.stopLoss.destroy();
        log.debug('>>>>>   SIGNALING ADVICE SHORT   <<<<<<<<<<<<');
        break;
      case 'bottom':
        this.stopLoss.create(this.stopLoss.percentage, price);
        this.advice('long');
        log.debug('>>>>>   SIGNALING ADVICE LONG    <<<<<<<<<<<<');
        break;
      case 'high':
      case 'low':
        this.advice();
        break;
      default:
        log.debug('>>>>>   UNKNOWN ZONE: ' + this.trend.zone + '    <<<<<<<<<<<<');
        break;
    }

    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: 0,
      persisted: false
    }
  }*/
}

module.exports = method;
