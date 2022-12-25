const express = require('express');
const db = require('../services/db');
var router = express.Router();

async function checkAdmin(req, res, next) {
    id = req.session.userId;
    role = 'admin';
    data = [id, role];
    if (id) {
        const rows = await db.executeQuery(`SELECT * from users where id = ? and role = ?`, data);
        if (rows.length > 0) {
            next();
        }
        else {
            // res.redirect('/');
            res.end("You are not admin");
        }
    } else {
        // res.redirect('/');
        res.end("You are not admin");
    }

}
router.get("/",checkAdmin, async (req, res) => {
    res.render('admin', {title: "Admin", session: req.session.userId, flag: 1});
});

router.get("/users/remove", checkAdmin, async (req, res) => {
    const users = await db.executeQuery(`SELECT * from users where not role = 'admin'`);
    res.render('adminRemoveUser', {title: "Remove", users: users, session: req.session.userId, flag: 1});
});

router.post("/users/remove", checkAdmin, async (req, res) => {
    const id = req.body.id;
    const data = [id];
    await db.executeQuery(`DELETE from users_items where userId = ?`, data);
    await db.executeQuery(`DELETE FROM transfer_history where senderId = ? or receiverId = ?`, [id, id]);
    await db.executeQuery(`DELETE FROM users WHERE id = ? and not role = 'admin'`, data);
    const users = await db.executeQuery(`SELECT * from users where not role = 'admin'`);
    res.render('adminRemoveUser', {
        title: "Remove", 
        users: users, 
        session: req.session.userId, 
        noti: "Xóa user thành công", 
        flag: 1
    });
});

router.get("/items", checkAdmin, async (req, res) => {
    const items = await db.executeQuery(`SELECT * from items`);
    res.render('adminModifyItem', {title: "Cập nhật hàng", items: items, session: req.session.userId, flag: 1});
});

router.get("/items/add", checkAdmin, async (req, res) => {
    res.render('adminAddItem', {title: "Nhập hàng", session: req.session.userId, flag: 1});
});

router.post("/items/add", checkAdmin, async (req, res) => {
    const name = req.body.name;
    const price = req.body.price;
    const amount = req.body.amount;
    var description = req.body.description;
    if (!name || !price || !amount) {
        res.render('adminAddItem', {
            title: "Nhập hàng", 
            session: req.session.userId, 
            noti: "Vui lòng nhập đầy đủ thông tin", 
            flag: 1
        });
        return;
    }
    const reg = /^\d+$/;
    if (reg.test(price) && reg.test(amount)) {
        if (!description) {
            description = '';
        }
        const data = [name, price, amount, description];
        await db.executeQuery(`INSERT INTO items (name, price, amount, description) VALUES (?, ?, ?, ?)`, data);
        res.render('adminAddItem', {title: "Nhập hàng", session: req.session.userId, noti: "Nhập hàng thành công", flag: 1});
    } else {
        res.render('adminAddItem', {title: "Nhập hàng", session: req.session.userId, noti: "Dữ liệu nhập vào không hợp lệ", flag: 1});
    }
});

router.get("/items/update/:id", checkAdmin, async (req, res) => {
    const id = req.params.id;
    const data = [id];
    const item = await db.executeQuery(`SELECT * from items where id = ?`, data);
    res.render('adminUpdateItem', {title: "Cập nhật hàng", item: item[0], session: req.session.userId, flag: 1});
});

router.post("/items/update/:id", checkAdmin, async (req, res) => {
    const id = req.params.id;
    var name = req.body.name;
    var price = req.body.price;
    var amount = req.body.amount;
    var description = req.body.description;
    const reg = /^\d+$|^$/;
    if (reg.test(price) && reg.test(amount)) {
        const item = await db.executeQuery(`SELECT * from items where id = ?`, [id]);
        if (!name) {
            name = item[0].name;
        }
        if (!price) {
            price = item[0].price;
        }
        if (!amount) {
            amount = item[0].amount;
        }
        if (!description) {
            description = item[0].description;
        }

        const data = [name, price, amount, description, id];
        await db.executeQuery(`UPDATE items SET name = ?, price = ?, amount = ?, description = ? WHERE id = ?`, data);
        const updatedItem = await db.executeQuery(`SELECT * from items where id = ?`, [id]);
        res.render('adminUpdateItem', {title: "Cập nhật hàng", item: updatedItem[0], session: req.session.userId, noti: "Cập nhật hàng thành công", flag: 1});
    } else {
        const item = await db.executeQuery(`SELECT * from items where id = ?`, [id]);
        res.render('adminUpdateItem', {title: "Cập nhật hàng", item: item[0], session: req.session.userId, noti: "Dữ liệu nhập vào không hợp lệ", flag: 1});
    }
});

router.get("/items/remove/:id", checkAdmin, async (req, res) => {
    const id = req.params.id;
    const data = [id];
    await db.executeQuery(`DELETE FROM users_items WHERE itemId = ?`, data);
    await db.executeQuery(`DELETE FROM items WHERE id = ?`, data);
    const items = await db.executeQuery(`SELECT * from items`);
    res.render('adminModifyItem', {title: "Cập nhật hàng", items: items, session: req.session.userId, noti: "Xóa hàng thành công", flag: 1});
});

module.exports = router;