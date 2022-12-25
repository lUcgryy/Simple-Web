const express = require('express');
const db = require('../services/db');
const hash = require('../services/hash');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
require('dotenv').config();

var router = express.Router();
var recaptcha = new Recaptcha(process.env.SITE_KEY, process.env.SECRET_KEY);

router.get("/", (req, res) => {
	res.render('register', {title: "Register"});
})

router.post("/", recaptcha.middleware.verify, async (req, res) => {
	if (!req.recaptcha.error) {
		email = req.body.email;
		if (email.length > 100) {
			res.render('register', {title: "Register", noti: "Email quá dài"});
			return;
		}
		const emailPattern = /^\w+([\.]?\w+)*@\w+([\.]?\w+)*(\.\w{2,3})+$/;
		if (email.match(emailPattern)) {
			username = req.body.username;
			password = req.body.password;
			confirmPassword = req.body.confirmPassword;
			if (!username || !password || !confirmPassword) {
				res.render('register', {title: "Register", noti: "Vui lòng điền đầy đủ thông tin"});
				return;
			}
			if (password.length < 8) {
				res.render('register', {title: "Register", noti: "Mật khẩu phải lớn hơn 8 ký tự"});
				return;
			}
			if (username.length > 40) {
				res.render('register', {title: "Register", noti: "Tên đăng nhập phải nhỏ hơn 40 ký tự"});
				return;
			}
			avatar = '/assets/default.png';
			if (password === confirmPassword) {
				const data = [username, hash.md5Hash(password), email, avatar];
				const checkUsername = await db.executeQuery(`SELECT * from users where username = ?`, [username]);
				const checkEmail = await db.executeQuery(`SELECT * from users where email = ?`, [email]);
				if (checkUsername.length === 0 && checkEmail.length === 0) {
					await db.executeQuery(`INSERT into users (username, password, role, money, email, avatar) values (?,?, 'user', 0, ?, ?)`, data)
					res.redirect('/login');
				} else if (checkUsername.length !== 0) {
					res.render('register', {title: "Register", noti: "Tên đăng nhập đã tồn tại"});
				} else {
					res.render('register', {title: "Register", noti: "Email đã tồn tại"});
				}
			} else {
				res.render('register', {title: "Register", noti: "Mật khẩu không khớp"});
			}
		} else {
			res.render('register', {title: "Register", noti: "Email không hợp lệ"});
		}
	} else {
		res.render('register', {title: "Register", noti: "Captcha không hợp lệ"});
	}	
})

module.exports = router;