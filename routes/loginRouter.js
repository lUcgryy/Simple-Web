const express = require('express');
const db = require('../services/db');
const hash = require('../services/hash');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
require('dotenv').config();

var router = express.Router();
var recaptcha = new Recaptcha(process.env.SITE_KEY, process.env.SECRET_KEY);

const oneWeek = 1000 * 60 * 60 * 24 * 7;

router.get("/", (req, res) => {
	res.render('login', {title: "Login"});
});

router.post("/", recaptcha.middleware.verify, async (req, res) => {
	if (!req.recaptcha.error) {
		username = req.body.username;
		password = req.body.password;
		if (!username || !password) {
			res.render('login', {title: "Login", noti: "Vui lòng điền đầy đủ thông tin"});
			return;
		}
		data = [username, hash.md5Hash(password)];
		const checkUser = await db.executeQuery('Select * from users where username = ? and password = ?', data)
		if (checkUser.length === 0) {
			res.render('login', {title: "Login", noti: "Sai tên đăng nhập hoặc mật khẩu"});
		} else {
			req.session.user = username;
			req.session.userId = checkUser[0].id;
			if (req.body.remember) {
				res.cookie('id', req.session.userId.toString(), {signed: true, maxAge: oneWeek});
				res.cookie('user', req.session.user, {signed: true, maxAge: oneWeek});
			} else {
				res.clearCookie('id');
				res.clearCookie('user');
			}
			res.redirect('/');
		} 
	} else {
		res.render('login', {title: "Login", noti: "Captcha không hợp lệ"});
	}
});

module.exports = router;