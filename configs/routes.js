(function() {
  module.exports = function(app) {
    app.routes = {
      '/': {
        controller: 'home',
        action: 'index'
      },
      '/posts': [
        {
          method: 'GET',
          controller: 'home',
          action: 'posts'
        }, {
          method: 'POST',
          controller: 'home',
          action: 'newpost'
        }
      ],
      '/tag/:tagName': {
        controller: 'home',
        action: 'index'
      },
      '/rss': {
        controller: 'home',
        action: 'rssFeed'
      },
      '/file/:fileName': {
        controller: 'home',
        action: 'downloadFile'
      },
      '/posts/tagged/:tagName': {
        controller: 'home',
        action: 'getPostsByTag'
      },
      '/admin': [
        {
          method: 'GET',
          controller: 'home',
          action: 'admin'
        }, {
          method: 'POST',
          controller: 'home',
          action: 'adminLogin'
        }
      ],
      '/upload': {
        method: 'POST',
        controller: 'home',
        action: 'upload'
      },
      '/delete/post/:postId': {
        controller: 'home',
        action: 'deletePost'
      },
      '/logout': {
        controller: 'home',
        action: 'logout'
      },
      '/:postTitle': {
        controller: 'home',
        action: 'index'
      },
      '/posts/:postTitle': {
        controller: 'home',
        action: 'getPostByTitle'
      }
    };
    return app.parseRoutes();
  };

}).call(this);
