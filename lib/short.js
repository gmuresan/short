/**
 * @list dependencies
 */

var ID = require('short-id')
  , mongoose = require('mongoose')
  //, Promise = require('bluebird')
  , Promise = require('node-promise').Promise
  , ShortURL = require('../models/ShortURL').ShortURL
  , Metrics = require('../models/ShortURL').Metrics
  , HtmlAttribute = require('../models/ShortURL').HtmlAttribute
  , HtmlElement = require('../models/ShortURL').HtmlElement;

exports.ShortURL = ShortURL;
exports.Metrics = Metrics;
exports.HtmlElement = HtmlElement;
exports.HtmlAttribute = HtmlAttribute;

/**
 * @configure short-id
 */

ID.configure({
  length: 6,
  algorithm: 'sha1',
  salt: Math.random
});

/**
 * @method connect
 * @param {String} mongdb Mongo DB String to connect to
 */

exports.connect = function(mongodb) {
  if (mongoose.connection.readyState === 0)
    mongoose.connect(mongodb);
    mongoose.Promise = require('bluebird');

  exports.connection = mongoose.connection;
};

/**
 * @method generate
 * @param {Object} options Must at least include a `URL` attribute
 */

exports.generate = function(document) {
  var generatePromise
    , promise = new Promise();

  document['data'] = document.data || null;
  /*
  document['metrics'] = {
    total: {clicks: 0, impressions: 0, destinationClicks: 0},
    daily: [],
    hourly: []
  }
  */
  document['user'] = document.user;

  var totalMetrics = new Metrics({clicks:0, impressions:0, destinationClicks:0});
  totalMetrics.save(function(err) {
    if(err) {
      console.log(err);
      return;
    }

    /*
    document['metrics'] = {
      total: totalMetrics
    };
    */
    //document['metrics']['total'] = totalMetrics;
    document['totalMetrics'] = totalMetrics._id;

    // hash was specified, so we should always honor it
    if (document.hasOwnProperty('hash')) {
      generatePromise = ShortURL.create(document);
    } else {
      document['hash'] = ID.store(document.URL);
      generatePromise = ShortURL.findOrCreate({URL : document.URL}, document, {});
    }

    generatePromise.then(function(ShortURLObject) {
      promise.resolve(ShortURLObject);
    }, function(error) {
      console.log(error);
      promise.reject(error, true);
    });

  });


  return promise;
};

/**
 * @method retrieve
 * @param {Object} options Must at least include a `hash` attribute
 */

exports.retrieve = function(hash) {
  var promise = new Promise();
  var query = { hash : hash }
    , update = { $inc: { hits: 1 } }
    , options = { multi: true };
  var retrievePromise = ShortURL.findOne(query).
    populate('totalMetrics').
    populate('dailyMetrics').
    populate('hourlyMetrics').exec();
  //ShortURL.update( query, update , options , function (){ } );
  retrievePromise.then(function(ShortURLObject) {
    if (ShortURLObject && ShortURLObject !== null) {
      promise.resolve(ShortURLObject);
    } else {
      promise.reject(new Error('MongoDB - Cannot find Document'), true);
    };
  }, function(error) {
    console.log(error);
    promise.reject(error, true);
  });
  return promise;
};

/**
 * @method update
 * @param {String} hash - must include a `hash` attribute
 * @param {Object} updates - must include either a `URL` or `data` attribute
 */

exports.update = function(hash, updates) {
  var promise = new Promise();
  ShortURL.findOne({hash: hash}, function(err, doc) {
    if (updates.URL) {
      doc.URL = updates.URL;
    }
    if (updates.data) {
      doc.data = extend(doc.data, updates.data);
      doc.markModified('data'); //Required by mongoose, as data is of Mixed type
    }
    doc.save(function(err, updatedObj, numAffected) {
      if (err) {
        promise.reject(new Error('MongoDB - Cannot save updates'), true);
      } else {
        promise.resolve(updatedObj);
      }
    });
  });
  return promise;
};

/**
 * @method hits
 * @param {Object} options Must at least include a `hash` attribute
 */

exports.hits = function(hash) {
  var promise = new Promise();
  var query = { hash : hash }
    , options = { multi: true };
  var retrievePromise = ShortURL.findOne(query);
  retrievePromise.then(function(ShortURLObject) {
    if (ShortURLObject && ShortURLObject !== null) {
      promise.resolve(ShortURLObject.hits);
    } else {
      promise.reject(new Error('MongoDB - Cannot find Document'), true);
    };
  }, function(error) {
    promise.reject(error, true);
  });
  return promise;
};

/**
 * @method list
 * @description List all Shortened URLs
 */

exports.list = function() {
  return ShortURL.find({});
};

/**
 * @method extend
 * @description Private function to extend objects
 * @param {Object} original The original object to extend
 * @param {Object} updated The updates; new keys are added, existing updated
 */

var extend = function(original, updates) {
  Object.keys(updates).forEach(function(key) {
    original[key] = updates[key];
  });
  return original;
};

