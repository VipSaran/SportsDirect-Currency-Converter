// ==UserScript==
// @name          SportsDirect.com Currency Converter
// @description   Greasemonkey/Tampermonkey UserScript for displaying prices in currency not supported originally
// @namespace     http://github.com/VipSaran/SportsDirect-Currency-Converter
// @updateURL     https://github.com/VipSaran/SportsDirect-Currency-Converter/raw/master/google_play_music_album_sorter.user.js
// @version       1.1.2
// @author        VipSaran
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @grant         GM_xmlhttpRequest
// @include       http://*.sportsdirect.com/*
// @include       https://*.sportsdirect.com/*
// @match         http://*.sportsdirect.com/*
// @match         https://*.sportsdirect.com/*
// @run-at        document-end
// ==/UserScript==

var DEBUG = false;

var targetCurrency = 'HRK';

function SportsDirectCurrencyConverter() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter()');
}

SportsDirectCurrencyConverter.prototype.getConversionRate = function(currFrom, currTo, callback) {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.getConversionRate()');

  var uFrom = currFrom.toUpperCase();
  var uTo = currTo.toUpperCase();

  var conversionName = uFrom + '_' + uTo;

  var storedRate = window.localStorage.getItem('rate_' + conversionName);
  var storedDate = parseInt(window.localStorage.getItem('date_' + conversionName));
  if (DEBUG) console.log('storedRate=', storedRate);
  if (DEBUG) console.log('storedDate=', storedDate);
  // check if exists and saved in last day
  if (storedRate === undefined || isNaN(storedRate) || isNaN(storedDate) || storedDate < (new Date().getTime() - (24 * 60 * 60 * 1000))) {
    // get the new/fresh conversion rate
    var URL = "http://api.fixer.io/latest?base=" + uFrom + "&symbols=" + uTo;

    /*
     * Example request:
     * http://api.fixer.io/latest?base=EUR&symbols=HRK
     *
     * Example response:
     * {
     *   "base": "EUR",
     *   "date": "2015-06-25",
     *   "rates": {
     *     "HRK": 7.5887
     *    }
     *  }
     */

    if (DEBUG) console.log('URL=', URL);
    GM_xmlhttpRequest({
      method: 'GET',
      url: URL,
      onload: function(response) {
        var data = response.responseText;
        if (DEBUG) console.log('onload:', data);
        var data = $.parseJSON(data);

        try {
          // parse data
          var conversionRate = data.rates[uTo];
          if (DEBUG) console.log('conversionRate=', conversionRate);

          // store the result
          converter.saveConversionRate(conversionName, conversionRate);

          callback(null, parseFloat(conversionRate));
        } catch (e) {
          callback(e, null);
        }
      },
      onerror: function(response) {
        if (DEBUG) console.log('onerror:', response);

        callback(new Error(response.responseText), null);
      }
    });
  } else {
    callback(null, parseFloat(storedRate));
  }
};

SportsDirectCurrencyConverter.prototype.saveConversionRate = function(conversionName, conversionRate) {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.saveConversionRate()');

  window.localStorage.setItem('rate_' + conversionName, conversionRate);
  window.localStorage.setItem('date_' + conversionName, new Date().getTime());
};

var getNumberStartingIndex = function(str) {
  var index = 0;
  if (!isNaN(str.substring(index, index + 1))) {
    return -1;
  }

  while (isNaN(str.substring(index, index + 1))) {
    index++;
  }

  return index;
};

var getNumberEndingIndex = function(str) {
  var index = str.length - 1;
  if (!isNaN(str.substring(index))) {
    return -1;
  }

  while (isNaN(str.substring(index, index + 1))) {
    index--;
  }

  return index;
};

var convertPrice = function(originalText, conversionRate) {
  var originalPriceStr = '';
  if ((startIdx = getNumberStartingIndex(originalText)) != -1) {
    originalPriceStr = originalText.substring(startIdx).trim();
  } else if ((endIdx = getNumberEndingIndex(originalText)) != -1) {
    originalPriceStr = originalText.substring(0, endIdx).trim();
  } else {
    throw new Error('Couldn\'t find the currency symbol');
  }

  if (isNaN(originalPriceStr)) {
    originalPriceStr = originalPriceStr.replace(',', '.').replace(' ', '').replace(' ', '');
  }

  var newPriceStr = (originalPriceStr * conversionRate).toFixed(2);
  // if (DEBUG) console.log('originalPriceStr=', originalPriceStr);
  // if (DEBUG) console.log('newPriceStr     =', newPriceStr);

  return newPriceStr;
};

var doConversions = function() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.doConversions()');

  converter.getConversionRate(selectedCurrency, targetCurrency, function(error, conversionRate) {
    if (error) {
      if (DEBUG) console.error('ERROR', error);
    } else {
      if (DEBUG) console.log('RESULT', conversionRate);

      /*
       * LIST PAGE
       */
      // update the selling price
      $('.curprice').each(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          $(this).text(newPriceStr + ' ' + targetCurrency);

          // some original currencies (CNY, HUF) have more digits, so are displayed with small letters --> revert style to large
          $(this).removeClass('CurrencySizeSmall').addClass('CurrencySizeLarge');
        } catch (e) {
          if (DEBUG) console.error(e);
          return;
        }
      });

      // update the ticket price
      $('span.s-smalltext').each(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          $(this).text(newPriceStr + ' ' + targetCurrency);
        } catch (e) {
          if (DEBUG) console.error(e);
          return;
        }
      });

      /*
       * ITEM PAGE
       */
      // update the selling price
      $("span[id$='lblSellingPrice']").text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });

      // update the ticket price
      $("span[id$='lblTicketPrice']").text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });

      // update the 'you save' price
      $('#lblWeLeftTab').text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });

      /*
       * RECENTLY VIEWED
       */
      // update the selling price
      $('span.AltStratSellPrice').text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });

      // update the ticket price
      $('span.AltStratRefPrice').text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });
    }
  });
};

var updateMostPopularInProgress = false;
var domMostPopularModifiedTimeout;

var doMostPopularConversions = function() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.doMostPopularConversions()');

  if (domMostPopularModifiedTimeout) {
    clearTimeout(domMostPopularModifiedTimeout);
  }

  updateMostPopularInProgress = true;

  converter.getConversionRate(selectedCurrency, targetCurrency, function(error, conversionRate) {
    if (error) {
      if (DEBUG) console.error('ERROR', error);
    } else {
      if (DEBUG) console.log('RESULT', conversionRate);

      /*
       * 'Most Popular'
       */
      // update the selling price
      $('span.PSSellPrice').text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });

      // update the ticket price
      $('span.PSRefPrice').text(function(index) {
        var originalText = $(this).text().trim();
        if (DEBUG) console.log('original price:', originalText);

        try {
          var newPriceStr = convertPrice(originalText, conversionRate);

          // replace the item price on page
          return newPriceStr + ' ' + targetCurrency;
        } catch (e) {
          if (DEBUG) console.error(e);
          return $(this).text();
        }
      });
    }

    updateMostPopularInProgress = false;
  });
};

var selectedCurrency;

SportsDirectCurrencyConverter.prototype.init = function() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.init()');

  selectedCurrency = $('#currencyLanguageSelector > .spanCurrencyLanguageSelector > p').text();
  selectedCurrency = selectedCurrency.substring(selectedCurrency.indexOf(' ')).trim();
  if (DEBUG) console.log('selectedCurrency="' + selectedCurrency + '"');

  setTimeout(function() {
    doConversions();
  }, 500);
};

var converter = new SportsDirectCurrencyConverter();

$(document).ready(function() {
  converter.init();

  // react to changes on 'Sort By'
  $('#dnn_ctr51055_BrowseV3View_ddlSortOptions1').change(function() {
    if (DEBUG) console.log('"Sort By" changed');

    setTimeout(function() {
      doConversions();
    }, 800);
  });

  // react to filter selections
  $('a.FilterAnchor').on('click', function() {
    if (DEBUG) console.log('filter changed');

    setTimeout(function() {
      doConversions();
    }, 1000);
  });

  // react to ITEM PAGE 'Colour' selection changes
  $('li.colorImgli').on('click', function() {
    if (DEBUG) console.log('"Colour" changed');

    setTimeout(function() {
      doConversions();
    }, 500);
  });

  // react to ITEM PAGE 'Size' changes
  $('#sizeDdl').change(function() {
    if (DEBUG) console.log('"Size" changed');

    setTimeout(function() {
      doConversions();
    }, 500);
  });

  // handle asynchronously loaded 'Most Popular' items
  $('.ModPSPlacementC').bind("DOMNodeInserted", function() {
    if (DEBUG) console.log('ModPSPlacementC DOMNodeInserted');

    if (domMostPopularModifiedTimeout) {
      clearTimeout(domMostPopularModifiedTimeout);
    }
    if (updateMostPopularInProgress) {
      return;
    }
    domMostPopularModifiedTimeout = setTimeout(function() {
      doMostPopularConversions();
    }, 500);
  });
});
