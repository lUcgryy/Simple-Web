require('dotenv').config();
const db = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	// port: '/var/run/mysqld/mysqld.sock'
	port: process.env.DB_PORT,
	charset: process.env.DB_CHARSET
};

module.exports = db;