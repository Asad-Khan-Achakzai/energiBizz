import { info } from "winston";

export const SERVER_PORT = process.env.SERVER_PORT || 5000;

//process.env.SERVER_PORT || 5000;
export const ENERGIBIZZ_URL = process.env.ENERGIBIZZ_URL || 'https://eb-vc-dev.trilloapps.com';
export const ENERGIBIZZ_SECRET = process.env.ENERGIBIZZ_SECRET || 'trillo123';
export const CALL_ENERGIBIZZ_CERTTYPE = process.env.CALL_OPENVIDU_CERTTYPE || 'selfsigned';
export const URL = 'https://192.168.0.125:4200/#/';
//export const URL = 'https://35.225.227.44:8080/#/';
//export const URL = 'https://eb-vc-dev.trilloapps.com/#/';


var mysql = require('mysql');

export const Config_SQLConnection = mysql.createConnection({ host: "192.168.0.132", user: "trillo", password: "trillo123", database: 'energibizz', insecureAuth: true });
//export const Config_SQLConnection = mysql.createConnection({host: "192.168.0.5", user: "trillo", password: "EnergiBizz@123", database: "energibizz"});
//export const Config_SQLConnection = mysql.createConnection({host: "10.128.0.2", user: "trillo", password: "trillo123", database: 'energibizz', insecureAuth : true});
//export const Config_SQLConnection = mysql.createConnection({host: "35.225.227.44", user: "trillo", password: "trillo123", database: 'energibizz', insecureAuth : true});

export const senderEmail= "asad.bsse3375@iiu.edu.pk";
var nodemailer = require("nodemailer");
export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "asad.bsse3375@iiu.edu.pk",
		pass: "xyz",
	},
});
const fs = require("fs");
export const winston = require("winston");
const logDir = "log";
const tsFormat = () => (new Date()).toLocaleTimeString();
export const logConfiguration = winston.createLogger({
	transports: [
		new (winston.transports.Console)({
			format: winston.format.combine(
				winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
				winston.format.printf((info) => {
					return `${info.timestamp}:[${info.level}]: ${JSON.stringify(info.message)}`;
				})),
			level: 'info'
		}),
		new (require("winston-daily-rotate-file"))({
			filename: `${logDir}/EnergiBizz.log`,
			format: winston.format.combine(
				winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
				winston.format.printf((info) => {
					return `${info.timestamp}:[${info.level}]: ${JSON.stringify(info.message)}`;
				}))
		}),
		new winston.transports.File({
			filename: 'log/error.log',
			level: 'info',
			format: winston.format.combine(
				winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
				winston.format.printf((info) => {
					return `${info.timestamp}:[${info.level}]: ${JSON.stringify(info.message)}`;
				}))
		})]
});
