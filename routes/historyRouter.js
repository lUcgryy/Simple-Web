const express = require('express');
const db = require('../services/db');
var router = express.Router();

router.get("/", async (req, res) => {
    userId = req.session.userId;
    if (userId) {
        const history = await db.executeQuery('SELECT * from transfer_history where senderId = ? or receiverId = ? order by `time` desc', [userId, userId]);
        if (history.length > 0) {
            const users = [];
            for (var i = 0; i < history.length; i++) {
                if (history[i].senderId === userId) {
                    const receiverId = history[i].receiverId;
                    const receiver = await db.executeQuery('SELECT * from users where id = ?', [receiverId]);
                    users.push(receiver[0].username);
                }
                else {
                    const senderId = history[i].senderId;
                    const sender = await db.executeQuery('SELECT * from users where id = ?', [senderId]);
                    users.push(sender[0].username);
                }
            }
            res.render('history', {
                title: "Lịch sử giao dịch", 
                session: req.session.userId,
                id: userId, 
                history: history, 
                flag: 1
            });
        } else {
            res.render('history', {
                title: "Lịch sử giao dịch", 
                session: req.session.userId,
                id: userId,
                flag: 1
            });
        }     
    } else {
        res.redirect('/login');
    }
});

module.exports = router;