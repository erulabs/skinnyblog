module.exports = (app) ->
	# Please generate your own secrets!
	app.server.use app.express.cookieParser('COOKIE SECRET')
	app.server.use app.express.cookieSession()
	app.server.use app.express.urlencoded()
	app.server.use app.express.session({ secret: 'SESSION SECRET' })
	
	# Base requirements of our blog:
	app.hashes = require 'jshashes'
	app.sha1 = new app.hashes.SHA1
	app.busboy = require 'busboy'
	app.tempfile = './tmp'
	app.pkgcloud = require 'pkgcloud'
	app.crypto = require 'crypto'

	# Configure newrelic.js and uncomment the following line to enable NewRelic APM
	#app.newrelic = require 'newrelic'

	# FIXME: Improve this - sanitize a query string before sending to the MongoDB adapter as a search query.
	# I'm not aware of anything that needs to happen - ie: the driver is pretty secure.
	# But this is where you can add whatever is needed to sanitize database query input.
	app.sanitize = (string) ->
		return string

	# The details of the rackspace account which contains the Cloud Files container used for uploading files
	app.rackspace = app.pkgcloud.storage.createClient {
		provider: 'rackspace'
		username: 'RACKSPACE USERNAME'
		apiKey: 'RACKSPACE API KEY'
		region: 'ORD'
	}
	# The name of the container
	app.container = 'somecontainer'

	# The base URL of the Rackspace CDN container
	app.containerURL = 'http://whatever.rackcdn.com/'

	# RSS/ITUNES integration options:
	# This must be the domain name of the site
	app.domain = 'example.com'
	# This is used for the RSS feeds base podcast description
	app.description = "A common site description string - this is used only by /rss"

	# Generates a security token for login / authentication
	app.generateToken = (callback) ->
		app.crypto.randomBytes 32, (ex, buf) ->
			token = buf.toString 'hex'
			callback(token)

	# Main authentication logic
	app.authenticate = (keys, callback) ->
		# Find admins with either the username and password or security token
		app.models.admin.find keys, (reply) ->
			# If we found a match
			if reply.length > 0
				# And they're already using a session
				if keys.session?
					# Then auth is good!
					callback(keys.session)
				else
					# otherwise generate a security token for them to use insead of sending passwords
					app.generateToken (token) ->
						app.db.collection('admin').update keys, {$set: { session: token }}, {w:1}, (reply) ->
							callback(token)
			else
				console.log 'Auth failed'
				callback false
