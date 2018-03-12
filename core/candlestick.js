/*
 * Copyright (C) 2016-Present Trendz.
 * MIT Licence.
 */

/**
 Make sure objects below comprise the following fields:
 {
    open: Number,
    high: Number,
    low: Number,
    close: Number
 }*/

const MAX_DOJI_BODY_PERCENT = 99.99;

function bodyLen(candlestick) {
  return Math.abs(candlestick.open - candlestick.close);
}

function isDojiBodyLen(candlestick) {
  return 100 * Math.min(candlestick.open, candlestick.close) / Math.max(candlestick.open, candlestick.close) >= MAX_DOJI_BODY_PERCENT;
}

function wickLen(candlestick) {
  return candlestick.high - Math.max(candlestick.open, candlestick.close);
}

function noWickLen(candlestick) {
  return candlestick.high - Math.max(candlestick.open, candlestick.close) == 0;
}

function tailLen(candlestick) {
  return Math.min(candlestick.open, candlestick.close) - candlestick.low;
}

function noTailLen(candlestick) {
  return Math.min(candlestick.open, candlestick.close) - candlestick.low == 0;
}

function isBullish(candlestick) {
  return candlestick.open < candlestick.close;
}

function isBearish(candlestick) {
  return candlestick.open > candlestick.close;
}

function isHammerLike(candlestick) {
  return tailLen(candlestick) > (bodyLen(candlestick) * 2) &&
    wickLen(candlestick) < bodyLen(candlestick);
}

function isInvertedHammerLike(candlestick) {
  return wickLen(candlestick) > (bodyLen(candlestick) * 2) &&
    tailLen(candlestick) < bodyLen(candlestick);
}

function isLongWickLike(candlestick) {
  return wickLen(candlestick) > (bodyLen(candlestick) * 3) &&
    tailLen(candlestick) < bodyLen(candlestick);
}

function isLongTailLike(candlestick) {
  return tailLen(candlestick) > (bodyLen(candlestick) * 3) &&
    wickLen(candlestick) < bodyLen(candlestick);
}

function isEngulfed(shortest, longest) {
  return bodyLen(shortest) < bodyLen(longest)  &&
    Math.min(shortest.open, shortest.close) >= Math.min(longest.open, longest.close) &&
    Math.max(shortest.open, shortest.close) <= Math.max(longest.open, longest.close);
}

function isGap(lowest, upmost) {
  return Math.max(lowest.open, lowest.close) < Math.min(upmost.open, upmost.close);
}

function isGapUp(previous, current) {
  return isGap(previous, current);
}

function isGapDown(previous, current) {
  return isGap(current, previous);
}

// Dynamic array search for callback arguments.
function findPattern(dataArray, callback) {
  const upperBound = (dataArray.length - callback.length) + 1;
  const matches = [];

  for (let i = 0; i < upperBound; i++) {
    const args = [];

    // Read the leftmost j values at position i in array.
    // The j values are callback arguments.
    for (let j = 0; j < callback.length; j++) {
      args.push(dataArray[i + j]);
    }

    // Destructure args and find matches.
    if (callback(...args)) {
      matches.push(args[1]);
    }
  }

  return matches;
}

// Boolean pattern detection.
// @public

function isDoji(candlestick) {
  return isDojiBodyLen(candlestick);
}

function isHammer(candlestick) {
  return isBullish(candlestick) &&
    isHammerLike(candlestick);
}

function isInvertedHammer(candlestick) {
  return isBearish(candlestick) &&
    isInvertedHammerLike(candlestick);
}

function isDragonfly(candlestick) {
  return isDojiBodyLen(candlestick) &&
    noWickLen(candlestick) &&
    isHammerLike(candlestick);
}

function isGravestone(candlestick) {
  return isDojiBodyLen(candlestick) &&
    noTailLen(candlestick) &&
    isInvertedHammerLike(candlestick);
}

function isBullishMarubozu(candlestick) {
  return isBullish(candlestick) &&
    noWickLen(candlestick) &&
    noTailLen(candlestick);
}

function isBearishMarubozu(candlestick) {
  return isBearish(candlestick) &&
    noWickLen(candlestick) &&
    noTailLen(candlestick);
}

function isBearishLongTail(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isLongTailLike(current);
}

function isHangingMan(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isGapUp(previous, current) &&
    isHammerLike(current);
}

function isShootingStar(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isGapUp(previous, current) &&
    isInvertedHammerLike(current);
}

function isBullishEngulfing(previous, current) {
  return isBearish(previous) &&
    isBullish(current) &&
    isEngulfed(previous, current);
}

function isBearishEngulfing(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isEngulfed(previous, current);
}

function isBullishHarami(previous, current) {
  return isBearish(previous) &&
    isBullish(current) &&
    isEngulfed(current, previous);
}

function isBearishHarami(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isEngulfed(current, previous);
}

function isBullishKicker(previous, current) {
  return isBearish(previous) &&
    isBullish(current) &&
    isGapUp(previous, current);
}

function isBearishKicker(previous, current) {
  return isBullish(previous) &&
    isBearish(current) &&
    isGapDown(previous, current);
}

function isAllBullish(dataArray) {
  for (let i = 0; i < dataArray.length; i++) {
    if (isBearish(dataArray[i]))
      return false;
  }

  return true;
}

function isAllBearish(dataArray) {
  for (let i = 0; i < dataArray.length; i++) {
    if (isBullish(dataArray[i]))
      return false;
  }

  return true;
}

// Pattern detection in arrays.
// @public

function doji(dataArray) {
  return findPattern(dataArray, isDoji);
}

function hammer(dataArray) {
  return findPattern(dataArray, isHammer);
}

function invertedHammer(dataArray) {
  return findPattern(dataArray, isInvertedHammer);
}

function gravestone(dataArray) {
  return findPattern(dataArray, isGravestone);
}

function bullishMarubozu(dataArray) {
  return findPattern(dataArray, isBullishMarubozu);
}

function bearishMarubozu(dataArray) {
  return findPattern(dataArray, isBearishMarubozu);
}

function dragonfly(dataArray) {
  return findPattern(dataArray, isDragonfly);
}

function bearishLongTail(dataArray) {
  return findPattern(dataArray, isBearishLongTail);
}

function hangingMan(dataArray) {
  return findPattern(dataArray, isShootingStar);
}

function shootingStar(dataArray) {
  return findPattern(dataArray, isShootingStar);
}

function bullishEngulfing(dataArray) {
  return findPattern(dataArray, isBullishEngulfing);
}

function bearishEngulfing(dataArray) {
  return findPattern(dataArray, isBearishEngulfing);
}

function bullishHarami(dataArray) {
  return findPattern(dataArray, isBullishHarami);
}

function bearishHarami(dataArray) {
  return findPattern(dataArray, isBearishHarami);
}

function bullishKicker(dataArray) {
  return findPattern(dataArray, isBullishKicker);
}

function bearishKicker(dataArray) {
  return findPattern(dataArray, isBearishKicker);
}

function blendTwoCandles(previous, current) {
  return {
    high: Math.max(previous.high, current.high),
    low: Math.min(previous.low, current.low),
    close: current.close,
    open: previous.open
  }
}

function blendCandles(dataArray) {
  var candle = null;

  if (dataArray.length)
    candle = dataArray[0];

  for (let i = 1; i < dataArray.length; i++) {
    candle = blendTwoCandles(candle, dataArray[i]);
  }

  return candle;
}

function calculateBodyPercentage(candlestick) {
  return 100 * Math.abs(candlestick.close - candlestick.open) / Math.min(candlestick.close, candlestick.open);
}

function calculateEngulfPercent(previous, current) {
  return 100 * bodyLen(current) / bodyLen(previous);
}

module.exports.isDoji = isDoji;
module.exports.isBullish = isBullish;
module.exports.isBearish = isBearish;

module.exports.isHammer = isHammer;
module.exports.isInvertedHammer = isInvertedHammer;
module.exports.isDragonfly = isDragonfly;
module.exports.isGravestone = isGravestone;
module.exports.isBullishMarubozu = isBullishMarubozu;
module.exports.isBearishMarubozu = isBearishMarubozu;
module.exports.isBearishLongTail = isBearishLongTail;
module.exports.isHangingMan = isHangingMan;
module.exports.isShootingStar = isShootingStar;
module.exports.isBullishEngulfing = isBullishEngulfing;
module.exports.isBearishEngulfing = isBearishEngulfing;
module.exports.isBullishHarami = isBullishHarami;
module.exports.isBearishHarami = isBearishHarami;
module.exports.isBullishKicker = isBullishKicker;
module.exports.isBearishKicker = isBearishKicker;
module.exports.isAllBullish = isAllBullish;
module.exports.isAllBearish = isAllBearish;

module.exports.doji = doji;
module.exports.hammer = hammer;
module.exports.invertedHammer = invertedHammer;
module.exports.dragonfly = dragonfly;
module.exports.gravestone = gravestone;
module.exports.bullishMarubozu = bullishMarubozu;
module.exports.bearishMarubozu = bearishMarubozu;
module.exports.bearishLongTail = bearishLongTail;
module.exports.hangingMan = hangingMan;
module.exports.shootingStar = shootingStar;
module.exports.bullishEngulfing = bullishEngulfing;
module.exports.bearishEngulfing = bearishEngulfing;
module.exports.bullishHarami = bullishHarami;
module.exports.bearishHarami = bearishHarami;
module.exports.bullishKicker = bullishKicker;
module.exports.bearishKicker = bearishKicker;
module.exports.blendTwoCandles = blendTwoCandles;
module.exports.blendCandles = blendCandles;
module.exports.calculateBodyPercentage = calculateBodyPercentage;
module.exports.calculateEngulfPercent = calculateEngulfPercent;
