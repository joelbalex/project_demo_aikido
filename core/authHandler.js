var db = require('../models')
var bCrypt = require('bcrypt')
var crypto = require('crypto') // Change from md5 to crypto for secure hashing

module.exports.isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		req.flash('authenticated', true)
		return next();
	}
	res.redirect('/login');
}

module.exports.isNotAuthenticated = function (req, res, next) {
	if (!req.isAuthenticated())
		return next();
	res.redirect('/learn');
}

module.exports.forgotPw = function (req, res) {
	if (req.body.login) {
		db.User.find({
			where: {
				'login': req.body.login
			}
		}).then(user => {
			if (user) {
				// Send reset link via email happens here
				req.flash('info', 'Check email for reset link')
				res.redirect('/login')
			} else {
				req.flash('danger', "Invalid login username")
				res.redirect('/forgotpw')
			}
		})
	} else {
		req.flash('danger', "Invalid login username")
		res.redirect('/forgotpw')
	}
}

module.exports.resetPw = function (req, res) {
	if (req.query.login) {
		db.User.find({
			where: {
				'login': req.query.login
			}
		}).then(user => {
			if (user) {
				const token = crypto.createHash('sha256').update(req.query.login).digest('hex'); // Secure hashing
				if (req.query.token == token) {
					res.render('resetpw', {
						login: req.query.login,
						token: req.query.token
					})
				} else {
					req.flash('danger', "Invalid reset token")
					res.redirect('/forgotpw')
				}
			} else {
				req.flash('danger', "Invalid login username")
				res.redirect('/forgotpw')
			}
		})
	} else {
		req.flash('danger', "Non Existant login username")
		res.redirect('/forgotpw')
	}
}

module.exports.resetPwSubmit = function (req, res) {
	if (req.body.password && req.body.cpassword && req.body.login && req.body.token) {
		if (req.body.password == req.body.cpassword) {
			db.User.find({
				where: {
					'login': req.body.login
				}
			}).then(user => {
				if (user) {
					const token = crypto.createHash('sha256').update(req.body.login).digest('hex'); // Secure hashing
					if (req.body.token == token) {
						user.password = bCrypt.hashSync(req.body.password, bCrypt.genSaltSync(10), null)
						user.save().then(function () {
							req.flash('success', "Passowrd successfully reset")
							res.redirect('/login')
						})
					} else {
						req.flash('danger', "Invalid reset token")
						res.redirect('/forgotpw')
					}
				} else {
					req.flash('danger', "Invalid login username")
					res.redirect('/forgotpw')
				}
			})
		} else {
			req.flash('danger', "Passowords do not match")
			res.render('resetpw', {
				login: req.query.login,
				token: req.query.token
			})
		}

	} else {
		req.flash('danger', "Invalid request")
		res.redirect('/forgotpw')
	}
}