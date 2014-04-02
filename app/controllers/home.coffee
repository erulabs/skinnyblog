module.exports = (app) ->
	notfound = (res) -> res.status(404).send('Not found')
	return {
		index: on
		admin: (req, res) ->
			if req.session.admin?
				res.redirect '/'
			else
				return undefined
		logout: (req, res) ->
			req.session.admin = null
			res.redirect '/'
		posts: (req, res) ->
			if req.session.admin?
				app.authenticate { session: req.session.admin }, (token) ->
					if token
						app.models.post.find {}, (posts) ->
							res.send {
								posts: posts
								admin: token
							}
					else
						req.session.admin = null
						res.redirect '/'
			else
				app.models.post.find {}, (posts) ->
					res.send {
						posts: posts
						admin: req.session.admin
					}
			return req
		rssFeed: (req, res) ->
			res.contentType "application/rss+xml"
			app.models.post.find { tags: 'podcast' }, (posts) ->
				o = []
				o.push '<?xml version="1.0" encoding="UTF-8"?>'
				o.push '<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'
				o.push '<channel>'
				o.push '	<atom:link href="http://'+app.domain+'/rss" rel="self" type="application/rss+xml" />'
				o.push '	<title>PodCast Title</title>'
				o.push '	<link>http://'+app.domain+'/</link>'
				o.push '	<language>en-us</language>'
				o.push '	<copyright>&#x2117; &amp; &#xA9; 2014 Some Name</copyright>'
				o.push '	<itunes:subtitle>Podcast by Someone!</itunes:subtitle>'
				o.push '	<itunes:author>Some Name</itunes:author>'
				o.push '	<itunes:explicit>yes</itunes:explicit>'
				o.push '	<itunes:summary>' + app.description + '</itunes:summary>'
				o.push '	<description>' + app.description + '</description>'
				o.push '	<itunes:owner>'
				o.push '		<itunes:name>Some Name</itunes:name>'
				o.push '		<itunes:email>someemail@address.com</itunes:email>'
				o.push '	</itunes:owner>'
				o.push '	<itunes:image href="http://'+app.domain+'/assets/img/blog.jpg" />'
				o.push '	<itunes:category text="Music"></itunes:category>'
				o.push '	<itunes:category text="Comedy"></itunes:category>'
				o.push '	<itunes:category text="Arts"></itunes:category>'
				o.push '	<itunes:category text="Technology"></itunes:category>'
				o.push '	<itunes:category text="Society &amp; Culture"></itunes:category>'
				for post in posts
					o.push '	<item>'
					o.push '		<title>' + post.title + '</title>'
					o.push '		<itunes:author>' + post.author + '</itunes:author>'
					o.push '		<itunes:subtitle>' + post.title + '</itunes:subtitle>'
					o.push '		<itunes:summary>' + post.content + '</itunes:summary>'
					o.push '		<itunes:explicit>yes</itunes:explicit>'
					o.push '		<itunes:image href="http://'+app.domain+'/assets/img/blog.jpg" />'
					o.push '		<enclosure url="'+app.containerURL+post.fileName+'" length="8727310" type="audio/x-m4a" />'
					o.push '		<guid>'+app.containerURL+post.fileName+'</guid>'
					o.push '		<pubDate>'+new Date(post.date).toUTCString()+'</pubDate>'
					o.push '		<itunes:duration>52:21</itunes:duration>'
					o.push '	</item>'
				o.push '</channel>'
				o.push '</rss>'
				res.send o.join "\n"
			return req
		getPostByTitle: (req, res) ->
			if title = req.params.postTitle
				app.models.post.find { title: title }, (posts) ->
					res.send {
						posts: posts
						admin: req.session.admin
					}
				return req
			notfound res
		getPostsByTag: (req, res) ->
			if tag = req.params.tagName
				tag = app.sanitize tag
				app.models.post.find { tags: tag }, (posts) ->
					if posts.length > 0
						res.send {
							posts: posts
							admin: req.session.admin
						}
					else
						notfound res
				return req
			notfound res
		downloadFile: (req, res) ->
			res.redirect app.containerURL + req.params.fileName
		adminLogin: (req, res) ->
			post = ''
			req.on 'data', (chunk) -> post = post + chunk.toString()
			req.on 'end', () ->
				post = JSON.parse post.toString()
				#app.models.admin.new(
				#	username: app.sanitize post.username
				#	password: app.sha1.hex app.sanitize post.password
				#}).save()
				app.authenticate {
					username: app.sanitize post.username
					password: app.sha1.hex app.sanitize post.password
				}, (token) ->
					if token
						req.session.admin = token
						res.send 'OK'
					else
						res.send 'fail'
			return req
		deletePost: (req, res) ->
			app.authenticate { session: req.session.admin }, (token) ->
				return notfound res if !token?
				id = app.sanitize req.params.postId
				app.models.post.remove { _id: new app.mongo.ObjectID(id) }, () ->
					res.send 'OK'
			return req
		newpost: (req, res) ->
			app.authenticate { session: req.session.admin }, (token) ->
				return notfound res if !token?
				post = ''
				req.on 'data', (chunk) -> post = post + chunk.toString()
				req.on 'end', () ->
					post = JSON.parse post.toString()
					if post.fileName?
						post.fileName = post.fileName.replace /\ /g, '_'
					post.author = 'Some person'
					post.date = new Date().getTime()
					post._id = new app.mongo.ObjectID(post._id) if post._id?
					app.models.post.new(post).save (error, inserted) ->
						res.send inserted
			return req
		upload: (req, res) ->
			app.authenticate { session: req.session.admin }, (token) ->
				return notfound res if !token?
				bus = new app.busboy { headers: req.headers }
				req.pipe bus
				bus.on 'file', (fieldname, file, filename, encoding, mimetype) ->
					filename = filename.replace /\ /g, '_'
					file.pipe app.rackspace.upload {
						container: app.container,
						remote: filename
					}, (error) ->
						if error then return res.send 'Upload failed!'
						res.send 'OK'
			return req
	}
