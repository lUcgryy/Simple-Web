const express = require('express');
const path = require('path');
const db = require('../services/db');
const hash = require('../services/hash');

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

function checkFileSize(file) {
    return !file.truncated;
}
function checkFileType(file) {
    const filetypes = /jpeg|jpg|png/;
    const mimetypes = /image\/*/;
    const check = mimetypes.test(file.mimetype) && filetypes.test(path.extname(file.name).toLowerCase());;
    return check;
}

router.get("/:id", initSession, async (req, res) => {
    userId = Number(req.params.id);
    if (userId === req.session.userId) {
        const user = req.session.user;
        const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
        res.render('profile', {title: 'Thông tin người dùng', id: userId, user: user, userData: userData[0], session: req.session.userId, flag: 1});
    } else {
        res.redirect('/login');
    }
});

router.post("/update/:id", initSession, async (req, res) => {
    const userId = Number(req.params.id);
    const user = req.session.user;
    const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
    if (userId === req.session.userId) {
        var name = req.body.name.trim();
        var email = req.body.email;
        var sdt = req.body.sdt;
        if (name.length > 40) {
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Tên quá dài, vui lòng nhập lại', 
                flag: 1
            });
            return;
        }
        if (email.length > 100) {
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Email quá dài, vui lòng nhập lại', 
                flag: 1
            });
            return;
        }
        if (sdt.length > 20) {
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Số điện thoại không vượt quá 20 số', 
                flag: 1
            });
            return;
        }
        
        const reg = /^\d+$|^$/;
        const emailPattern = /^\w+([\.]?\w+)*@\w+([\.]?\w+)*(\.\w{2,3})+$|^$/;
        if (reg.test(sdt) && emailPattern.test(email)) {
            if (!name) {
                name = userData[0].name;
            }
            if (!email) {
                email = userData[0].email;
            }
            if (!sdt) {
                sdt = userData[0].sdt;
            }
            const data = [name, email, sdt, userId];
            await db.executeQuery('Update users set name = ?, email = ?, sdt = ? where id = ?', data);
            const updatedUser = await db.executeQuery('Select * from users where id = ?', [userId]);
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: updatedUser[0], 
                session: req.session.userId, 
                noti: 'Cập nhật thành công', 
                flag: 1});
        } else {
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Số điện thoại hoặc email không hợp lệ', 
                flag: 1});
        }
    } else {
        res.redirect('/login');
    }
});

router.post("/updatepass/:id", initSession, async (req, res) => {
    const userId = Number(req.params.id);
    const user = req.session.user;
    if (userId === req.session.userId) {
        var oldPass = req.body.password;
        var newPass = req.body.newPassword;
        var confirmPass = req.body.confirmNewPassword;
        if (newPass.length < 8) {
            const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Mật khẩu mới phải có ít nhất 8 ký tự',
                flag: 1
            });
            return;
        }
        const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
        if (newPass === confirmPass) {
            if (hash.md5Hash(oldPass) === userData[0].password) {
                const data = [hash.md5Hash(newPass), userId];
                await db.executeQuery('Update users set password = ? where id = ?', data);
                res.render('profile', {
                    title: 'Thông tin người dùng', 
                    id: userId, 
                    user: user, 
                    userData: userData[0], 
                    session: req.session.userId, 
                    noti: 'Cập nhật mật khẩu thành công', 
                    flag: 1});
            } else {
                res.render('profile', {
                    title: 'Thông tin người dùng', 
                    id: userId, 
                    user: user, 
                    userData: userData[0], 
                    session: req.session.userId, 
                    noti: 'Mật khẩu cũ không đúng', 
                    flag: 1});
            }
        } else {
            res.render('profile', {
                title: 'Thông tin người dùng', 
                id: userId, 
                user: user, 
                userData: userData[0], 
                session: req.session.userId, 
                noti: 'Mật khẩu mới không khớp', 
                flag: 1
            });
        }
    } else {
        res.redirect('/login');
    }           
});

router.get("/upload/:id", initSession, async (req, res) => {
    res.redirect('/profile/' + req.params.id);
})
router.post("/upload/:id", initSession, async (req, res) => {
    console.log(req.files);
    const userId = Number(req.params.id);
    const user = req.session.user;
    if (userId === req.session.userId) {
        const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
        if (req.files) {
            var file = req.files.avatar;
            if (!checkFileSize(file)) {
                res.render('profile', {
                    title: 'Thông tin người dùng',
                    id: userId,
                    user: user,
                    userData: userData[0],
                    session: req.session.userId,
                    noti: 'Kích thước file không vượt quá 2MB',
                    flag: 1
                });
                return;
            }
            if (!checkFileType(file)) {
                res.render('profile', {
                    title: 'Thông tin người dùng',
                    id: userId,
                    user: user,
                    userData: userData[0],
                    session: req.session.userId,
                    noti: 'Chỉ chấp nhận file png, jpg, jpeg',
                    flag: 1
                });
                return;
            }
            var filename = 'avatar' + req.params.id + '.jpg';
            var uploadPath = path.join(__dirname, '../public/assets', filename);
            file.mv(uploadPath, async (err) => {
                if (err) {
                    res.render('profile', {
                        title: 'Thông tin người dùng',
                        id: userId,
                        user: user,
                        userData: userData[0],
                        session: req.session.userId,
                        noti: 'Có gì đó không ổn, cập nhật không thành công',
                        flag: 1
                    });
                } else {
                    const data = ['/assets/' + filename, userId];
                    await db.executeQuery('Update users set avatar = ? where id = ?', data);
                    const updatedUser = await db.executeQuery('Select * from users where id = ?', [userId]);
                    res.render('profile', {
                        title: 'Thông tin người dùng',
                        id: userId,
                        user: user,
                        userData: updatedUser[0],
                        session: req.session.userId,
                        noti: 'Cập nhật thành công',
                        flag: 1
                    });
                }
            });
        } else {
            const userData = await db.executeQuery('Select * from users where id = ?', [userId]);
            res.render('profile', {
                title: 'Thông tin người dùng',
                id: userId,
                user: user,
                userData: userData[0],
                session: req.session.userId,
                noti: 'Chưa có hình để cập nhật',
                flag: 1
            }); 
        }
    } else {
        res.redirect('/login');
    }
});

module.exports = router;