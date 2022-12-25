const express = require('express');
const db = require('../services/db');
var router = express.Router();

function initSession(req, res, next) {
    if (req.signedCookies.id && !req.session.userId) {
        req.session.userId = req.signedCookies.id;
    }
    if (req.signedCookies.user && !req.session.user) {
        req.session.user = req.signedCookies.user;
    }
    next();
}

router.get("/:id", initSession, (req, res) => {
	userId = Number(req.params.id);
	if (userId === req.session.userId) {
		res.render('update', {title: 'Update', id: userId, session: req.session.userId, flag: 1});
	} else {
		res.redirect('/login');
	}
});

router.post("/:id", initSession, (req, res) => {
	userId = Number(req.params.id);
	if (userId === req.session.userId) {
		creditCard = req.body.creditCard;
		money = req.body.money;
		const reg = /^\d+$/;
		if (reg.test(creditCard) && creditCard.length === 16 && reg.test(money)) {
			db.executeQuery('Select * from users where id = ?', [userId]).then((rows) => {
				if (rows.length === 0) {
					res.end("User not found");
				} else {
					if (money > 1000000) {
						res.render('update', {title: 'Update', id: userId, session: req.session.userId, noti: "Số tiền nạp không vượt quá 1000000", flag: 1});
						return;
					}
					updatedMoney = rows[0].money + Number(money);
					req.session.money = updatedMoney;
					data = [updatedMoney, userId];
					db.executeQuery('Update users set money = ? where id = ?', data).then((rows) => {
						res.render('update', {title: 'Update', id: userId, session: req.session.userId, noti: "Nạp thành công", flag: 1});
					})
				}
			});
		} else {
			res.render('update', {title: 'Update', id: userId, session: req.session.userId, noti: "Số thẻ hoặc số tiền không hợp lệ", flag: 1});
		}
	} else {
		res.redirect('/login');
	}
});
module.exports = router;