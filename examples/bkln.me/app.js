
/*!

  http://github/edwardhotchkiss/short/

*/

var url = require('url'),
    express = require('express'),
    short = require('short'),
    app = express.createServer(),
    port = process.env.PORT || 8000,
    MONGO_DB_SHORT = process.env.MONGO_DB_SHORT || 'mongodb://localhost/short';

short.connect(MONGO_DB_SHORT);

app.configure(function() {
  app.use(express.static(__dirname+'/public'));
  app.use(express.bodyParser());
});

app.post('/api/*', function(request, response) {
  if (request.url === '/favicon.ico') {
    return;
  }
  var URL = request.body['url'];
  short.gen(URL, function (error, shortURL) {
    if (error) {
      console.error(error);
    } else {
      var URL = shortURL.URL;
      var hash = shortURL.hash;
      var tiny_url = 'http://localhost:' + port + '/' + hash;
      console.log('URL is ' + URL + ' ' + tiny_url);
      response.send({ url:tiny_url });
    }
  });
});

app.get('*', function(request, response) {
  if (request.url === '/favicon.ico') {
    return;
  }
  var hash = request.url.slice(1);
  short.get(hash, function (error, shortURLObject) {
    if (error) {
      console.error(error);
    }  else {
      if (shortURLObject) {
        response.redirect(shortURLObject[0].URL, 302);
      } else {
        response.send('URL not found!', 404);
        response.end();
      }
    }
  });
});

app.listen(port, function () {
  console.log('Server running on port ' + port);
});

/* EOF */