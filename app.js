const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyparser = require('body-parser');
const session = require('express-session');
const rfs = require('rotating-file-stream');
const {v4: uuidv4} = require('uuid');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();

app.all('*', (req, res, next) => {
	if (req.secure) {
		return next();
	}
	res.redirect('https://' + req.hostname + ':' + securePort + req.url);
});

const port = process.env.PORT || 3000;
const securePort = process.env.PORT || 3443;	
const accessLogStream = rfs.createStream('access.log', {
	interval: '1d',
	path: path.join(__dirname, 'log')
});
const options = {
	key: fs.readFileSync(__dirname + '/certs/private.key'),
	cert: fs.readFileSync(__dirname + '/certs/certificate.pem'),
};

var registerRouter = require('./routes/registerRouter');
var loginRouter = require('./routes/loginRouter');
var logoutRouter = require('./routes/logoutRouter');
var updateRouter = require('./routes/updateRouter');
var itemRouter = require('./routes/itemRouter');
var profileRouter = require('./routes/profileRouter');
var transferRouter = require('./routes/transferRouter');
var historyRouter = require('./routes/historyRouter');
var vipRouter = require('./routes/vipRouter');
var adminRouter = require('./routes/adminRouter');

// luu log vao file /log/access.log
app.use(morgan('combined', { stream: accessLogStream}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true}));
app.use(cookieParser(uuidv4()));
app.use(fileupload({
	limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(session({
	secret: uuidv4(),
	resave: false,
	saveUninitialized: true
}))

app.set('view engine', 'ejs')			

app.use('/', itemRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/update', updateRouter);
app.use('/profile', profileRouter);
app.use('/transfer', transferRouter);
app.use('/history', historyRouter);
app.use('/vip', vipRouter);
app.use('/admin', adminRouter);

//Xử lí  404
app.use(function(req, res) {
	res.status(400);
	res.render('404', {title: '404: File Not Found'});
});

app.use(function(error, req, res, next) {
	res.status(500);
	res.render('500', {title:'500: Lỗi Server', error: error});
});
var server = http.createServer(app);
server.listen(port, () => {
	console.log(`Server is running at port ${port}`);
});

var secureServer = https.createServer(options, app);
secureServer.listen(securePort, () => {
	console.log(`Server is running at port ${securePort}`);
});