'use strict';

/**
 * Express configuration.
 */

var express = require('express'),
		consolidate = require('consolidate'),
		fs = require('fs'),
		config = require('./config');

module.exports = function(app, passport) {
	// place before express.static to make sure all assets and data are compressed
	app.use(express.compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		// slowest, best compression
		level: 9
	}));

	// assign the template engine to .html files
	app.engine('html', consolidate[config.templateEngine]);
	app.set('view engine', 'html');
	app.set('views', config.root + '/app/views');

	app.configure(function() {
		// the cookieParser should be above session
		app.use(express.cookieParser('supersecret lotr'));

		// request body parsing middleware should be above methodOverride
		app.use(express.urlencoded());
		app.use(express.json());
		app.use(express.methodOverride());

		app.use(express.session({secret: 'keyboard cathrine'}));

		// use passport session
		app.use(passport.initialize());
		app.use(passport.session());

		//all the directories in the '/public' directory should serve the files
		//everything else will be handled in the router
		var publicPath = config.root + '/public';
		fs.readdirSync(publicPath).forEach(function(file) {
			var filePath = publicPath + '/' + file;
			if(fs.statSync(filePath).isDirectory()){
				app.use('/' + file, express.static(filePath));
			}
		});
		
		//favicon
		app.use(express.favicon(publicPath + '/img/facicon.ico'));

		// routes should be at the last
		app.use(app.router);
	});
};