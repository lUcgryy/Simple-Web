const express = require('express');
const db = require('../services/db');
const Recaptcha = require('express-recaptcha').RecaptchaV2;

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

router.get("/", initSession, async (req, res) => {
    userId = req.session.userId;
    if (userId) {
        const sender = await db.executeQuery(`SELECT * from users where id = ?`, [userId]);
        res.render('transfer', {
            title: 'Chuyển tiền', 
            id: userId, 
            session: userId,
            money: sender[0].money, 
            flag: 1
        });
    } else {
        res.redirect('/login');
    }
});

router.post("/", initSession, async (req, res) => {
    userId = req.session.userId;
    if (req.session.userId) {
        const name = req.body.name;
        const sender = await db.executeQuery(`SELECT * from users where id = ?`, [userId]);
        const receiver = await db.executeQuery(`Select * from users where (username = ? or email = ?) and not role = 'admin' and not id = ?`, [name, name, userId]);
        if (receiver.length > 0) {
            res.render('transfer', {
                title: 'Chuyển tiền', 
                id: userId, 
                session: req.session.userId, 
                userData: receiver[0], 
                money: sender[0].money, 
                found: 1,
                flag: 1
            });
        } else {
            res.render('transfer', {
                title: 'Chuyển tiền', 
                id: userId, 
                session: req.session.userId,
                money: sender[0].money, 
                noti: 'Không tìm thấy người nhận, vui lòng thử lại',
                flag: 1
            });
        }
    } else {
        res.redirect('/login');
    }
});

router.get("/confirm", initSession, async (req, res) => {
    res.redirect('/transfer');
});

router.post("/confirm", initSession, async (req, res) => {
    userId = req.session.userId;
    if (req.session.userId) {
        money = req.body.money;
        note = req.body.note;
        receiverId = req.body.id;
        var sender = await db.executeQuery('Select * from users where id = ?', [userId]);
        var receiver = await db.executeQuery(`Select * from users where id = ? and not role = 'admin'`, [receiverId]);
        const reg = /^\d+$/;
        if (reg.test(money)) {
            money = Number(money);
            if (money > 1000000) {
                res.render('transfer', {
                    title: 'Chuyển tiền', 
                    id: userId, 
                    session: req.session.userId, 
                    userData: receiver[0],
                    noti: 'Số tiền không được quá 1000000',
                    money: sender[0].money,
                    flag: 1
                });
                return;
            }
            senderMoney = sender[0].money;
            receiverMoney = receiver[0].money;
            if (senderMoney >= money) {
                await db.executeQuery(`Update users set money = ? where id = ?`, [senderMoney - money, userId]);
                await db.executeQuery(`Update users set money = ? where id = ?`, [receiverMoney + money, receiverId]);
                await db.executeQuery(`Insert into transfer_history (senderId, receiverId, money, note) values (?, ?, ?, ?)`, [userId, receiverId, money, note]);
                const updatedSender = await db.executeQuery(`Select * from users where id = ?`, [userId]);
                res.render('transfer', {
                    title: 'Chuyển tiền', 
                    id: userId, 
                    session: req.session.userId, 
                    noti: 'Chuyển tiền thành công',
                    money: updatedSender[0].money, 
                    flag: 1
                });
            } else {
                res.render('transfer', {
                    title: 'Chuyển tiền', 
                    id: userId, 
                    session: req.session.userId, 
                    userData: receiver[0],
                    noti: 'Số tiền trong tài khoản không đủ',
                    money: sender[0].money,
                    flag: 1
                });
            }
        } else {
            res.render('transfer', {
                title: 'Chuyển tiền', 
                id: userId, 
                session: req.session.userId, 
                userData: receiver[0],
                noti: 'Số tiền không hợp lệ',
                money: sender[0].money,
                flag: 1
            });
        }
    } else {
        res.redirect('/login');
    }
});

module.exports = router;