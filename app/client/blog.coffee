ng = angular.module 'blog', ['ui.bootstrap']

ng.directive('fileModel', [ '$parse', ($parse) ->
	return {
		restrict: 'A'
		link: (scope, element, attrs) ->
			model = $parse attrs.fileModel
			modelSetter = model.assign
			element.bind 'change', () ->
				scope.$apply () ->
					modelSetter scope, element[0].files[0]
	}
])

ng.controller 'BlogCtrl', [ '$sce', '$scope', '$http', ($sce, $scope, $http) ->
	$scope.tags =
		tech: yes
		culture: yes
		politics: yes
		other: yes
	$scope.loginForm =
		username: undefined
		password: undefined
	$scope.admin = false
	$scope.formatDate = (date) =>
		months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]
		if date? then now = new Date(parseInt(date, 10)) else now = new Date().getTime()
		return [ months[now.getMonth()], now.getDate() + 'th,', now.getFullYear() ].join ' '
	$scope.formatTags = (tags) =>
		out = []
		for tag in tags
			out.push '<a href="/tag/' + tag + '">' + tag.charAt(0).toUpperCase() + tag.substr(1) + '</a>'
		return out.join ', '
	$scope.trustAsHtml = $sce.trustAsHtml
	$scope.adminLogin = () ->
		sha1 = new Hashes.SHA1
		$http.post('/admin', {
			username: $scope.loginForm.username
			password: sha1.hex($scope.loginForm.password)
		}).success (data, status, headers, config) ->
			if data is 'OK' then return window.location = '/'
			else
				$scope.alert = 'login failed!'
	$scope.newPost = () ->
		$scope.posts.push {
			title: 'An example title!'
			content: 'Put the content of your blog post here!'
			date: new Date().getTime()
			tags: [ 'podcast', 'music' ]
			tempTags: 'someTag'
			edit: yes
		}
	$scope.deletePost = (post) ->
		$http.get('/delete/post/' + post._id).success (data, status, headers, config) ->
			if status isnt 200 then return alert 'delete failed!'
			post.hidden = yes
			post.removed = yes
	$scope.savePost = (post) ->
		delete post.edit
		delete post.tempTags
		if post.file then uploadFileToUrl post.file, '/upload', () ->
			post.fileName = post.file.name
			delete post.file
			$http.post('/posts', post).success (data, status, headers, config) ->
				if status isnt 200 then alert 'Post failed!'
				post._id = data._id
		else
			$http.post('/posts', post).success (data, status, headers, config) ->
				if status isnt 200 then alert 'Post failed!'
				post._id = data._id
	uploadFileToUrl = (file, uploadUrl, callback) ->
		fd = new FormData()
		fd.append 'file', file
		$scope.uploading = true
		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			fileName: file.name
			headers: {'Content-Type': undefined}
		}).success (data, status, headers, config) ->
			if status isnt 200 then alert 'Post failed!'
			if data isnt "OK" then alert 'Post Failed!'
			$scope.uploading = false
			callback()
	$scope.setTags = (post) ->
		post.tags = post.tempTags.replace(/\,/g, '').split ' '
	$scope.isPostVisible = (post) =>
		if post.removed?
			return no
		else if $scope.admin
			return yes
		else
			if post.hidden? and post.hidden then return false
			found = no
			visible = yes
			for tag in post.tags
				if $scope.tags[tag]?
					found = yes
					if !$scope.tags[tag]
						visible = no
					break
			if !found
				return $scope.tags.other
			return visible
	$scope.logout = () ->
		window.location = '/logout'
	if window.location.pathname.substr(0, 5) is '/tag/'
		postUrl = '/posts/tagged/' + window.location.pathname.substr(5)
	else if window.location.pathname.substr(0, 7) is '/admin'
		postUrl = undefined
	else
		postUrl = '/posts' + window.location.pathname
	if postUrl?
		$http.get(postUrl).success (data, status, headers, config) ->
			$scope.admin = data.admin
			if $scope.admin
				for post in data.posts
					post.tempTags = post.tags.join(' ')
			$scope.posts = data.posts
			if $scope.posts.length == 0
				$scope.fourohfour = 'No posts matched your search!'
]
