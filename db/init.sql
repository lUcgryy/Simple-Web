create database IF NOT EXISTS MyDB;
ALTER DATABASE MyDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
use MyDB;

drop table if EXISTS transfer_history;
drop table if EXISTS users_items;
drop table if EXISTS users;
drop table if EXISTS items;
drop table if EXISTS vip;

create table vip (
	id int(3) auto_increment primary key,
    `type` varchar(20),
	price int unsigned
);

create table users (
	id int(3) auto_increment primary key,
	username varchar(30) not null,
	password varchar(40) not null,
	`role` varchar(20) DEFAULT 'user',
    `name` varchar(40) default '',
	money int unsigned default 0,
    sdt varchar(20) default '',
    email varchar(100) not null,
    avatar varchar(30) default '/assets/default.png',
    vip int(3),
    vipExpire datetime,
    foreign key (vip) references vip(id)	
);
create table items (
	id int(3) auto_increment primary key,
    `name` varchar(30) not null,
    `description` varchar(100),
    amount int(3) unsigned,
    price int unsigned
);
create table users_items (
	userId int(3) not null,
    itemId int(3) not null,
    `time` datetime default current_timestamp,
    quantity int(3) unsigned,
    primary key (userId, itemId, time),
    foreign key (userId) references users(id),
    foreign key (itemId) references items(id)
);

create table transfer_history (
    id int(3) auto_increment primary key,
    senderId int(3) not null,
    receiverId int(3) not null,
    `time` datetime default current_timestamp,
    money int(3) unsigned,
    note varchar(100),
    foreign key (senderId) references users(id),
    foreign key (receiverId) references users(id)
);


insert into users (username, password, role, email, money,`name`, sdt) values ('admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin','admin@gmail.com', 0,'','');

insert into items (name, description, amount, price) values ('Táo', 'táo Mỹ', 5, 100);
insert into items (name, description, amount, price) values ('Chuối', 'Non', 6, 200);
insert into items (name, description, amount, price) values ('Dâu', 'Đà Lạt', 7, 300);
insert into items (name, description, amount, price) values ('Thanh Long', 'Bình Thuận', 8, 400);
insert into items (name, description, amount, price) values ('Cam', 'Nó màu cam', 9, 500);

insert into vip (type, price) values ('Month', 200);
insert into vip (type, price) values ('Year', 1500);
