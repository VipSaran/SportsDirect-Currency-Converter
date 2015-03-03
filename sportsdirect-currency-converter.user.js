// ==UserScript==
// @name          SportsDirect.com Currency Converter
// @description   Greasemonkey/Tampermonkey UserScript for displaying prices in currency not supported originally
// @namespace     http://github.com/VipSaran/SportsDirect-Currency-Converter
// @updateURL     https://github.com/VipSaran/SportsDirect-Currency-Converter/raw/master/google_play_music_album_sorter.user.js
// @version       1.0.1
// @author        VipSaran
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @grant         GM_xmlhttpRequest
// @include       http://www.sportsdirect.com*
// @include       https://www.sportsdirect.com*
// @match         http://www.sportsdirect.com*
// @match         https://www.sportsdirect.com*
// @run-at        document-end
// ==/UserScript==

var DEBUG = true;

function SportsDirectCurrencyConverter() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter()');
}

SportsDirectCurrencyConverter.prototype.getConversionRate = function(currFrom, currTo, callback) {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.getConversionRate()');

  var conversionName = currFrom.toUpperCase() + '_' + currTo.toUpperCase();

  var storedRate = window.localStorage.getItem('rate_' + conversionName);
  var storedDate = parseInt(window.localStorage.getItem('date_' + conversionName));
  console.log('storedRate=', storedRate);
  console.log('storedDate=', storedDate);
  // check if exists and saved in last day
  if (storedRate === undefined || isNaN(storedDate) || storedDate < (new Date().getTime() - (24 * 60 * 60 * 1000))) {
    // get the new/fresh conversion rate
    var URL = "http://www.freecurrencyconverterapi.com/api/v3/convert?q=" + conversionName;
    console.log('URL=', URL);
    GM_xmlhttpRequest({
      method: 'GET',
      url: URL,
      onload: function(response) {
        var data = response.responseText;
        console.log('onload:', data);
        var data = $.parseJSON(data);

        try {
          // parse data
          var conversionRate = data.results[conversionName].val;
          console.log('conversionRate=', conversionRate);

          // store the result
          converter.saveConversionRate(conversionName, conversionRate);

          callback(null, parseFloat(conversionRate));
        } catch (e) {
          callback(e, null);
        }
      },
      onerror: function(response) {
        console.log('onerror:', response);

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

SportsDirectCurrencyConverter.prototype.init = function() {
  if (DEBUG) console.log('SportsDirectCurrencyConverter.init()');

  var selectedCurrency = $('#currencyLanguageSelector > span > p').html().substring(2);
  console.log('selectedCurrency="' + selectedCurrency + '"');

  converter.getConversionRate(selectedCurrency, 'HRK', function(error, result) {
    if (error) {
      console.error('ERROR', error);
    } else {
      console.log('RESULT', result);
    }
  });
};

var converter = new SportsDirectCurrencyConverter();

$(document).ready(function() {
  converter.init();
});