(function() {
  module.exports = function(app) {
    var notfound;
    notfound = function(res) {
      return res.status(404).send('Not found');
    };
    return {
      index: true,
      admin: function(req, res) {
        if (req.session.admin != null) {
          return res.redirect('/');
        } else {
          return void 0;
        }
      },
      logout: function(req, res) {
        req.session.admin = null;
        return res.redirect('/');
      },
      posts: function(req, res) {
        if (req.session.admin != null) {
          app.authenticate({
            session: req.session.admin
          }, function(token) {
            if (token) {
              return app.models.post.find({}, function(posts) {
                return res.send({
                  posts: posts,
                  admin: token
                });
              });
            } else {
              req.session.admin = null;
              return res.redirect('/');
            }
          });
        } else {
          app.models.post.find({}, function(posts) {
            return res.send({
              posts: posts,
              admin: req.session.admin
            });
          });
        }
        return req;
      },
      rssFeed: function(req, res) {
        res.contentType("application/rss+xml");
        app.models.post.find({
          tags: 'podcast'
        }, function(posts) {
          var o, post, _i, _len;
          o = [];
          o.push('<?xml version="1.0" encoding="UTF-8"?>');
          o.push('<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
          o.push('<channel>');
          o.push('	<atom:link href="http://' + app.domain + '/rss" rel="self" type="application/rss+xml" />');
          o.push('	<title>PodCast Title</title>');
          o.push('	<link>http://' + app.domain + '/</link>');
          o.push('	<language>en-us</language>');
          o.push('	<copyright>&#x2117; &amp; &#xA9; 2014 Some Name</copyright>');
          o.push('	<itunes:subtitle>Podcast by Someone!</itunes:subtitle>');
          o.push('	<itunes:author>Some Name</itunes:author>');
          o.push('	<itunes:explicit>yes</itunes:explicit>');
          o.push('	<itunes:summary>' + app.description + '</itunes:summary>');
          o.push('	<description>' + app.description + '</description>');
          o.push('	<itunes:owner>');
          o.push('		<itunes:name>Some Name</itunes:name>');
          o.push('		<itunes:email>someemail@address.com</itunes:email>');
          o.push('	</itunes:owner>');
          o.push('	<itunes:image href="http://' + app.domain + '/assets/img/blog.jpg" />');
          o.push('	<itunes:category text="Music"></itunes:category>');
          o.push('	<itunes:category text="Comedy"></itunes:category>');
          o.push('	<itunes:category text="Arts"></itunes:category>');
          o.push('	<itunes:category text="Technology"></itunes:category>');
          o.push('	<itunes:category text="Society &amp; Culture"></itunes:category>');
          for (_i = 0, _len = posts.length; _i < _len; _i++) {
            post = posts[_i];
            o.push('	<item>');
            o.push('		<title>' + post.title + '</title>');
            o.push('		<itunes:author>' + post.author + '</itunes:author>');
            o.push('		<itunes:subtitle>' + post.title + '</itunes:subtitle>');
            o.push('		<itunes:summary>' + post.content + '</itunes:summary>');
            o.push('		<itunes:explicit>yes</itunes:explicit>');
            o.push('		<itunes:image href="http://' + app.domain + '/assets/img/blog.jpg" />');
            o.push('		<enclosure url="' + app.containerURL + post.fileName + '" length="8727310" type="audio/x-m4a" />');
            o.push('		<guid>' + app.containerURL + post.fileName + '</guid>');
            o.push('		<pubDate>' + new Date(post.date).toUTCString() + '</pubDate>');
            o.push('		<itunes:duration>52:21</itunes:duration>');
            o.push('	</item>');
          }
          o.push('</channel>');
          o.push('</rss>');
          return res.send(o.join("\n"));
        });
        return req;
      },
      getPostByTitle: function(req, res) {
        var title;
        if (title = req.params.postTitle) {
          app.models.post.find({
            title: title
          }, function(posts) {
            return res.send({
              posts: posts,
              admin: req.session.admin
            });
          });
          return req;
        }
        return notfound(res);
      },
      getPostsByTag: function(req, res) {
        var tag;
        if (tag = req.params.tagName) {
          tag = app.sanitize(tag);
          app.models.post.find({
            tags: tag
          }, function(posts) {
            if (posts.length > 0) {
              return res.send({
                posts: posts,
                admin: req.session.admin
              });
            } else {
              return notfound(res);
            }
          });
          return req;
        }
        return notfound(res);
      },
      downloadFile: function(req, res) {
        return res.redirect(app.containerURL + req.params.fileName);
      },
      adminLogin: function(req, res) {
        var post;
        post = '';
        req.on('data', function(chunk) {
          return post = post + chunk.toString();
        });
        req.on('end', function() {
          post = JSON.parse(post.toString());
          return app.authenticate({
            username: app.sanitize(post.username),
            password: app.sha1.hex(app.sanitize(post.password))
          }, function(token) {
            if (token) {
              req.session.admin = token;
              return res.send('OK');
            } else {
              return res.send('fail');
            }
          });
        });
        return req;
      },
      deletePost: function(req, res) {
        app.authenticate({
          session: req.session.admin
        }, function(token) {
          var id;
          if (token == null) {
            return notfound(res);
          }
          id = app.sanitize(req.params.postId);
          return app.models.post.remove({
            _id: new app.mongo.ObjectID(id)
          }, function() {
            return res.send('OK');
          });
        });
        return req;
      },
      newpost: function(req, res) {
        app.authenticate({
          session: req.session.admin
        }, function(token) {
          var post;
          if (token == null) {
            return notfound(res);
          }
          post = '';
          req.on('data', function(chunk) {
            return post = post + chunk.toString();
          });
          return req.on('end', function() {
            post = JSON.parse(post.toString());
            if (post.fileName != null) {
              post.fileName = post.fileName.replace(/\ /g, '_');
            }
            post.author = 'Some person';
            post.date = new Date().getTime();
            if (post._id != null) {
              post._id = new app.mongo.ObjectID(post._id);
            }
            return app.models.post["new"](post).save(function(error, inserted) {
              return res.send(inserted);
            });
          });
        });
        return req;
      },
      upload: function(req, res) {
        app.authenticate({
          session: req.session.admin
        }, function(token) {
          var bus;
          if (token == null) {
            return notfound(res);
          }
          bus = new app.busboy({
            headers: req.headers
          });
          req.pipe(bus);
          return bus.on('file', function(fieldname, file, filename, encoding, mimetype) {
            filename = filename.replace(/\ /g, '_');
            return file.pipe(app.rackspace.upload({
              container: app.container,
              remote: filename
            }, function(error) {
              if (error) {
                return res.send('Upload failed!');
              }
              return res.send('OK');
            }));
          });
        });
        return req;
      }
    };
  };

}).call(this);
