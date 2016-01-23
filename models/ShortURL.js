
/**
 * @model ShortURL
 */

var options
  , ShortURLSchema
  , mongoose = require('mongoose')
  , wrapper = require('./prototype.js')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Promise = require('bluebird');

options = {
  versionKey : false
};

HtmlAttributeSchema = new Schema({
  key: {type: String},
  value: {type: String, default:''}
});

HtmlElementSchema = new Schema({
  tag: {type: String},
  attributes: [HtmlAttributeSchema],
  innerHtml: {type: String}
});

MetricsSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  destinationClicks: { type: Number, default: 0},
  user: { type: ObjectId, ref: 'User'},
  link: { type: ObjectId, ref: 'ShortURL'}
});

ShortURLSchema = new Schema({
  id         : { type : ObjectId },
  URL        : { type : String, unique: false },
  hash       : { type : String, unique: true },
  hits       : { type : Number, default: 0 },
  data       : { type : Schema.Types.Mixed },
  created_at : { type : Date, default: Date.now },
  user     : { type : ObjectId, ref: 'User' },
  totalMetrics : { type : ObjectId, ref: 'Metrics'},
  dailyMetrics : [{type: ObjectId, ref: 'Metrics'}],
  hourlyMetrics: [{type: ObjectId, ref: 'Metrics'}],

  headElements: [HtmlElementSchema]

}, options);

ShortURL = mongoose.model('ShortURL', ShortURLSchema);

ShortURL.findOrCreate = function(query, document, options) {
  return new Promise(function(resolve, reject) {
    ShortURL.findOne(query, function(error, result) {
      if(error) {
        if(error.message && error.message.match(/E11000/i)) {
          reject(new Error('Duplicate Key Error'), true);
        } else {
          reject(error, true);
        };
      } else {
        if(result && result !== null) {
          resolve(result);
        } else {
          ShortURL.create(document, function(error, result) {
            if(error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        }
      };
    });
  });
};


exports.ShortURL = ShortURL;
exports.Metrics = mongoose.model('Metrics', MetricsSchema);
exports.HtmlElement = mongoose.model('HtmlElement', HtmlElementSchema);
exports.HtmlAttribute = mongoose.model('HtmlAttribute', HtmlAttributeSchema);


