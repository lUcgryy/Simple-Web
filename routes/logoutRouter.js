const express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.log(err);
			res.send("Something wrong");
		} else {
			res.clearCookie('id');
			res.clearCookie('user');
			res.redirect('/');
		}
	})
})

module.exports = router;