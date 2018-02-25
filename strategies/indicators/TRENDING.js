// no required indicators
// Trending - Max Vuong implementation 2018-02-24

var Indicator = function(TRENDINGSettings) {
  this.input = 'price';
  this.settings = TRENDINGSettings;

  this.oldest = 0;
  this.newest = 0;

  this.low = 0;
  this.high = 0;

  this.trend = null;

  this.stopLoss = 0;
  this.stopBuy = 0;

  this.initialized = false;
}

Indicator.prototype.update = function(price) {

  if (this.initialized) {
    this.newest = price;

    if (this.trend == 'up') {
      if (this.newest > this.high) {
        this.high = this.newest;
        this.calcStopLoss();
      } else if (this.newest <= this.stopLoss) {
        this.trend = 'down';
        this.oldest = this.high;
        this.low = this.newest;
        this.calcStopBuy();
      }
    } else if (this.trend == 'down') {
      if (this.newest < this.low) {
        this.low = this.newest;
        this.calcStopBuy();
      } else if (this.newest >= this.stopBuy) {
        this.trend = 'up';
        this.oldest = this.low;
        this.high = this.newest;
        this.calcStopLoss();
      }
    }
  } else {
    if (!this.oldest)
      this.oldest = price;
    else {
      this.latest = price;

      if (this.oldest < this.latest) {
        this.trend = 'up';
        this.low = this.oldest;
        this.high = this.newest;
        this.calcStopLoss();
      } else if (this.oldest > this.latest) {
        this.trend = 'down';
        this.low = this.newest;
        this.high = this.oldest;
        this.calcStopBuy();
      } else {
        return; // If equal, get another price
      }

      this.initialized = true;
    }
  }
}

Indicator.prototype.calcStopLoss = function() {
  this.stopLoss = this.high - 1; // TODO:
}

Indicator.prototype.calcStopBuy = function() {
  this.stopBuy = this.low + 1; // TODO:
}

module.exports = Indicator;
