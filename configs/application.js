(function() {
  module.exports = function(app) {
    app.server.use(app.express.cookieParser('COOKIE SECRET'));
    app.server.use(app.express.cookieSession());
    app.server.use(app.express.urlencoded());
    app.server.use(app.express.session({
      secret: 'SESSION SECRET'
    }));
    app.hashes = require('jshashes');
    app.sha1 = new app.hashes.SHA1;
    app.busboy = require('busboy');
    app.tempfile = './tmp';
    app.pkgcloud = require('pkgcloud');
    app.crypto = require('crypto');
    app.sanitize = function(string) {
      return string;
    };
    app.rackspace = app.pkgcloud.storage.createClient({
      provider: 'rackspace',
      username: 'RACKSPACE USERNAME',
      apiKey: 'RACKSPACE API KEY',
      region: 'ORD'
    });
    app.container = 'somecontainer';
    app.containerURL = 'http://whatever.rackcdn.com/';
    app.domain = 'example.com';
    app.description = "A common site description string - this is used only by /rss";
    app.generateToken = function(callback) {
      return app.crypto.randomBytes(32, function(ex, buf) {
        var token;
        token = buf.toString('hex');
        return callback(token);
      });
    };
    return app.authenticate = function(keys, callback) {
      return app.models.admin.find(keys, function(reply) {
        if (reply.length > 0) {
          if (keys.session != null) {
            return callback(keys.session);
          } else {
            return app.generateToken(function(token) {
              return app.db.collection('admin').update(keys, {
                $set: {
                  session: token
                }
              }, {
                w: 1
              }, function(reply) {
                return callback(token);
              });
            });
          }
        } else {
          console.log('Auth failed');
          return callback(false);
        }
      });
    };
  };

}).call(this);
