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
function addMonth(date, month) {
    var d = date.getDate();
    date.setMonth(date.getMonth() + month);
    if (date.getDate() != d) {
        date.setDate(0);
    }
    return date;
}

async function checkVipExpire(req, res, next) {
    const id = req.session.userId;
    if (id) {
        const user = await db.executeQuery(`SELECT * from users where id = ?`, [id]);
        if (user[0].vip) {
            const vipExpire = user[0].vipExpire;
            const now = new Date();
            if (now > vipExpire) {
                // console.log("Expired");
                await db.executeQuery(`UPDATE users SET vip = null, vipExpire = null where id = ?`, [id]);
            } 
        }
    }
    next();
}

router.get("/", initSession, checkVipExpire, async (req, res) => {
    userId = req.session.userId;
    if (userId) {
        const user = await db.executeQuery(`SELECT * from users where id = ?`, [userId]);
        if (user[0].vip) {
            res.render('vip', {
                title: 'VIP', 
                id: userId, 
                session: userId,
                expire: user[0].vipExpire,
                flag: 1,
                vip: 1
            });
        } else {
            const vips = await db.executeQuery(`SELECT * from vip`);
            res.render('vip', {
                title: 'VIP',
                id: userId,
                session: userId,
                vips: vips,
                money: user[0].money,
                flag: 1
            });
        }
    } else {
        res.redirect('/login');
    }
});

router.post("/", initSession, checkVipExpire, async (req, res) => {
    userId = req.session.userId;
    if (userId) {
        const vipId = Number(req.body.id);
        const user = await db.executeQuery(`SELECT * from users where id = ?`, [userId]);
        const vip = await db.executeQuery(`SELECT * from vip where id = ?`, [vipId]);
        if (vip[0].type === 'Month') {
            var date = new Date();
            date = addMonth(date, 1);
        } else if (vip[0].type === 'Year') {
            var date = new Date();
            date = addMonth(date, 12);
        }
        if (user[0].money >= vip[0].price) {
            await db.executeQuery(`UPDATE users SET money = money - ?, vip = ?, vipExpire = ? WHERE id = ?`, [vip[0].price, vip[0].id, date, userId]);
            res.redirect('/vip');
        } else {
            const vips = await db.executeQuery(`SELECT * from vip`);
            res.render('vip', {
                title: 'VIP',
                id: userId,
                session: userId,
                money: user[0].money,
                noti: 'Số tiền không đủ',
                flag: 1,
                vips: vips
            });
        }
    } else {
        res.redirect('/login');
    }
});

module.exports = router;