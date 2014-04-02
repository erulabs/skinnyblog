(function() {
  var ng;

  ng = angular.module('blog', ['ui.bootstrap']);

  ng.directive('fileModel', [
    '$parse', function($parse) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var model, modelSetter;
          model = $parse(attrs.fileModel);
          modelSetter = model.assign;
          return element.bind('change', function() {
            return scope.$apply(function() {
              return modelSetter(scope, element[0].files[0]);
            });
          });
        }
      };
    }
  ]);

  ng.controller('BlogCtrl', [
    '$sce', '$scope', '$http', function($sce, $scope, $http) {
      var postUrl, uploadFileToUrl;
      $scope.tags = {
        tech: true,
        culture: true,
        politics: true,
        other: true
      };
      $scope.loginForm = {
        username: void 0,
        password: void 0
      };
      $scope.admin = false;
      $scope.formatDate = (function(_this) {
        return function(date) {
          var months, now;
          months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          if (date != null) {
            now = new Date(parseInt(date, 10));
          } else {
            now = new Date().getTime();
          }
          return [months[now.getMonth()], now.getDate() + 'th,', now.getFullYear()].join(' ');
        };
      })(this);
      $scope.formatTags = (function(_this) {
        return function(tags) {
          var out, tag, _i, _len;
          out = [];
          for (_i = 0, _len = tags.length; _i < _len; _i++) {
            tag = tags[_i];
            out.push('<a href="/tag/' + tag + '">' + tag.charAt(0).toUpperCase() + tag.substr(1) + '</a>');
          }
          return out.join(', ');
        };
      })(this);
      $scope.trustAsHtml = $sce.trustAsHtml;
      $scope.adminLogin = function() {
        var sha1;
        sha1 = new Hashes.SHA1;
        return $http.post('/admin', {
          username: $scope.loginForm.username,
          password: sha1.hex($scope.loginForm.password)
        }).success(function(data, status, headers, config) {
          if (data === 'OK') {
            return window.location = '/';
          } else {
            return $scope.alert = 'login failed!';
          }
        });
      };
      $scope.newPost = function() {
        return $scope.posts.push({
          title: 'An example title!',
          content: 'Put the content of your blog post here!',
          date: new Date().getTime(),
          tags: ['podcast', 'music'],
          tempTags: 'someTag',
          edit: true
        });
      };
      $scope.deletePost = function(post) {
        return $http.get('/delete/post/' + post._id).success(function(data, status, headers, config) {
          if (status !== 200) {
            return alert('delete failed!');
          }
          post.hidden = true;
          return post.removed = true;
        });
      };
      $scope.savePost = function(post) {
        delete post.edit;
        delete post.tempTags;
        if (post.file) {
          return uploadFileToUrl(post.file, '/upload', function() {
            post.fileName = post.file.name;
            delete post.file;
            return $http.post('/posts', post).success(function(data, status, headers, config) {
              if (status !== 200) {
                alert('Post failed!');
              }
              return post._id = data._id;
            });
          });
        } else {
          return $http.post('/posts', post).success(function(data, status, headers, config) {
            if (status !== 200) {
              alert('Post failed!');
            }
            return post._id = data._id;
          });
        }
      };
      uploadFileToUrl = function(file, uploadUrl, callback) {
        var fd;
        fd = new FormData();
        fd.append('file', file);
        $scope.uploading = true;
        return $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          fileName: file.name,
          headers: {
            'Content-Type': void 0
          }
        }).success(function(data, status, headers, config) {
          if (status !== 200) {
            alert('Post failed!');
          }
          if (data !== "OK") {
            alert('Post Failed!');
          }
          $scope.uploading = false;
          return callback();
        });
      };
      $scope.setTags = function(post) {
        return post.tags = post.tempTags.replace(/\,/g, '').split(' ');
      };
      $scope.isPostVisible = (function(_this) {
        return function(post) {
          var found, tag, visible, _i, _len, _ref;
          if (post.removed != null) {
            return false;
          } else if ($scope.admin) {
            return true;
          } else {
            if ((post.hidden != null) && post.hidden) {
              return false;
            }
            found = false;
            visible = true;
            _ref = post.tags;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              tag = _ref[_i];
              if ($scope.tags[tag] != null) {
                found = true;
                if (!$scope.tags[tag]) {
                  visible = false;
                }
                break;
              }
            }
            if (!found) {
              return $scope.tags.other;
            }
            return visible;
          }
        };
      })(this);
      $scope.logout = function() {
        return window.location = '/logout';
      };
      if (window.location.pathname.substr(0, 5) === '/tag/') {
        postUrl = '/posts/tagged/' + window.location.pathname.substr(5);
      } else if (window.location.pathname.substr(0, 7) === '/admin') {
        postUrl = void 0;
      } else {
        postUrl = '/posts' + window.location.pathname;
      }
      if (postUrl != null) {
        return $http.get(postUrl).success(function(data, status, headers, config) {
          var post, _i, _len, _ref;
          $scope.admin = data.admin;
          if ($scope.admin) {
            _ref = data.posts;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              post = _ref[_i];
              post.tempTags = post.tags.join(' ');
            }
          }
          $scope.posts = data.posts;
          if ($scope.posts.length === 0) {
            return $scope.fourohfour = 'No posts matched your search!';
          }
        });
      }
    }
  ]);

}).call(this);
