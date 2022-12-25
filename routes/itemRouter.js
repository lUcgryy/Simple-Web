const express = require('express');
const ejs = require('ejs');
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
    const user = req.session.user;
    const userID = req.session.userId;
    const items = await db.executeQuery(`SELECT * from items`);
    if (userID) {
        const userData = await db.executeQuery(`SELECT * from users where id = ?`, [userID]);
        var money = userData[0].money;
        var vip = userData[0].vip;
    } else {
        var money = null;
        var vip = null;
    }
    const html = await ejs.renderFile('views/item.ejs', {
        title: "Welcome", 
        items: items, 
        user: user, 
        money: money, 
        session: req.session.userId,
        vip: vip, 
        flag: 1,
        id: userID
    }, {async: true});
    res.send(html);
    
});

router.post("/", initSession, checkVipExpire, async (req, res) => {
    const userID = req.session.userId;
    if (userID) {
        const user = req.session.user;
        const items = await db.executeQuery(`SELECT * from items`);
        const userData = await db.executeQuery(`SELECT * from users where id = ?`, [userID]);
        const money = userData[0].money;
        const itemID = Number(req.body.id);
        const quantity = req.body.quantity;
        const vip = userData[0].vip;
        const reg = /^\d+$/;
        if (reg.test(quantity)) {
            const discount = vip? 0.7: 1; 
            const item = await db.executeQuery(`SELECT * from items where id = ?`, [itemID]);
        // console.log(item);
            if (item.length === 0) {
                res.end("Item not found");
            }
            else {
                const price = item[0].price * discount;
                const amount = item[0].amount;
                if (money >= price * quantity && amount >= quantity) {
                    left = amount - quantity;
                    const data = [userID, itemID, left];
                    await db.executeQuery(`INSERT into users_items (userId, itemId, quantity) values (?,?,?)`, data);
                    await db.executeQuery(`UPDATE users set money = money - ? where id = ?`, [price * quantity, userID]);
                    await db.executeQuery(`UPDATE items set amount = ? where id = ?`, [left, itemID]);
                    const updatedItems = await db.executeQuery(`SELECT * from items`);
                    updatedMoney = money - price * quantity;
                    const html = await ejs.renderFile('views/item.ejs', {
                        title: "Welcome", 
                        items: updatedItems, 
                        user: user, 
                        money: updatedMoney, 
                        session: req.session.userId, 
                        noti: "Mua thành công", 
                        flag: 1,
                        vip: vip,
                        id: userID
                    }, {async: true});
                    res.send(html);
                } else {
                    const html = await ejs.renderFile('views/item.ejs', {
                        title: "Welcome",
                        items: items, 
                        user: user, 
                        money: money, 
                        session: req.session.userId, 
                        noti: "Mua không thành công", 
                        flag: 1,
                        vip: vip,
                        id: userID
                    }, {async: true});
                    res.send(html);
                }
            }
        } else {
            const html = await ejs.renderFile('views/item.ejs', {
                title: "Welcome", 
                items: items, 
                user: user, 
                money: money, 
                session: req.session.userId, 
                noti: "Số lượng mua không hợp lệ", 
                vip: vip,
                flag: 1
            }, {async: true});
            res.send(html);
        }
    } else {
        res.redirect('/login');
    }
});
module.exports = router;