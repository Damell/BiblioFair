var config = require('../../config/config'),
	mongoose = require("mongoose"),
	//
	Book = mongoose.model("BookModel"),
	User = mongoose.model("UserModel"),
	http = require('http'),
	//emails
	Mailgun = require('mailgun').Mailgun,
	mg = new Mailgun(config.mail.key),
	messages = require('../helpers/messaging').messages,
	_ = require('lodash');

var regex = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};

/**
 * Count all the books in the Bibliofair database.
 * 
 * @param {function} done
 * @returns {undefined}
 */

exports.count = function(done) {
	Book.count({num_users: {$gt: 0}},function(err, data) {
		done(err, data);
	});
};

/**
 * Get books specified by the options.
 * 
 * @param {object} options
 * @param {function} done
 * @returns {undefined}
 */

exports.get = function(options, done) {
	//extend defaults with the options
	options = _.extend({
		limit: 0,
		offset: 0,
		query: '',
		fields: '',
		radius: 100000
	}, options);

	if(options.lat && options.lng && options.radius){
		var re = new RegExp(regex(options.query), 'i');
		Book.find({$or: [{title: re}, {author: re}], num_users: {$gt: 0}}).where('loc.coordinates').near({center: [options.lng, options.lat], maxDistance: (options.radius / 111.12), spheriacal: true}).select(options.fields).skip(options.offset).limit(options.limit).populate('users', {"library": 1, _id: 0}, 'UserModel').exec(function(err, data) {
			done(err, data);
		});
	} else if (options.noUsers) {
		var re = new RegExp(regex(options.query), 'i');
		Book.find({$or: [{title: re}, {author: re}, {isbn: re}]}).select(options.fields).skip(options.offset).limit(options.limit).exec(function(err, data) {
			done(err, data);
		});
	} else {
		var re = new RegExp(regex(options.query), 'i');
		Book.find({$or: [{title: re}, {author: re}], num_users: {$gt: 0}}).select(options.fields).skip(options.offset).limit(options.limit).populate('users', {"library": 1, _id: 0}, 'UserModel').exec(function(err, data) {
			done(err, data);
		});
	}
};

/**
 * Get a book by its id.
 * 
 * @param {ObjectId} id
 * @param {function} done
 * @returns {undefined}
 */

exports.one = function(id, done) {
	Book.load(id, function(err, data) {
		done(err, data);
	});
};

/**
 * Search for a book (currently TEL database using TEL's API).
 * 
 * @param {number} isbn
 * @param {function} done
 * @returns {undefined}
 */

exports.search = function(isbn, done) {
	var options = require('url').parse('http://data.theeuropeanlibrary.org/opensearch/json?query=' + isbn + '&apikey=ev3fbloutqdhrqe3pidpal4bav');
	options.rejectUnauthorized = false;

	var data = "";
	http.get(options, function(response) {
		response.on('data', function(i) {
			data += i;
		});
		response.on('end', function() {
			done(null, JSON.parse(data));
		});
		response.on('error', function(e) {
			done(e, 'error');
			console.log(e);
		});
	});
}

/**
 * Report a book.
 */

exports.report = function(user, book, done) {
	User.findById(user, function(err, user) {
		if(err || !user){
			return done(err || "user.notFound");
		}
		else{
			Book.findById(book, function(err, book) {
				if(err || !book){
					return done(err || "book.notFound");
				}
				else{
					mg.sendText('Book report <report@bibliofair.com>',
						config.mail.report,
						messages['en'].emails.report.subject,
						messages['en'].emails.report.body.replace(/\{username\}/g, user.username)
						.replace(/\{book.title\}/, book.title)
						.replace(/\{book.author\}/, book.author),
						config.mail.server,
						function(err) {
							done(err, 'ok');
						});
				}
			});
		}
	});
};

/**
 * Request a book.
 */

exports.request = function(from, to, book, language, done) {
	if(from === to) {
		done(messages[language].errors.request.yourself);
	} 
	else {
		User.findByUsername(from, function(err, from) {
			if(err || !from){
				return done(err || "user.notFound");
			}
			User.findByUsername(to, function(err, to) {
				if(err || !to){
					return done(err || "user.notFound");
				}
				Book.findById(book, function(err, book) {
					if(err || !book){
						return done(err || "book.notFound");
					}
					var text = (messages[language].emails.request.body + messages[language].emails._explanation).replace(/\{from\}/g, from.username)
					.replace(/\{to\}/g, to.username)
					.replace(/\{book.title\}/g, book.title)
					.replace(/\{book.author\}/g, book.author)
					.replace(/\{book.author\}/g, book.author)
					.replace(/\{recipient\}/g, to.username + "@bibliofair.com");
					//save message
					from.messages.push({to: to._id, text: text});
					to.messages.push({from: from._id, text: text});
					from.save();
					to.save();

					mg.sendText(from.username + ' <' + from.username + '@bibliofair.com>',
						to.username + ' <' + to.email + '>',
						messages[language].emails.request.subject,
						text,
						config.mail.server,
						function(err) {
							done(err, 'ok');
						});
				});
			});
		});
	}
};
