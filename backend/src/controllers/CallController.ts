
import * as express from 'express';
import { Request, Response } from 'express';
import { ENERGIBIZZ_URL, ENERGIBIZZ_SECRET, URL, transporter, logConfiguration, winston, senderEmail } from '../config';
import { EnergiBizzService } from '../services/EnergiBizzService';
import { DatabaseService } from '../services/DatabaseService';
import { isRegExp } from 'util';
const EventEmitter = require('events');
const axios = require('axios');

const stream = new EventEmitter();
const bcrypt = require('bcrypt');
const shortid = require('shortid');
const logger = winston.createLogger(logConfiguration);
const appc = express();
export const app = express.Router({
	strict: true
});

var
	CircularJSON = require('circular-json');
const util = require('util')
const request = require("request");

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey('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')

let connection = 0;

const energiBizzService = new EnergiBizzService();
const databaseService = new DatabaseService();
databaseService.connectDatabase();
app.get('/checkMuteAll', function (req, res) {
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
		"Access-Control-Allow-Origin": "*"
	});
	res.socket.on('end', e => {
		console.log('event source closed');
	});
	stream.setMaxListeners(0);
	stream.on('push', function (event, data) {
		res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + "\n\n");
	});
});
app.post('/start', async (req: Request, res: Response) => {
	logger.info('/call/start');
	logger.info(req.body);
	let sessionId: string = req.body.sessionId;
	console.log('start recording recive', req.body);
	try {
		const response = await energiBizzService.startRecording(sessionId, ENERGIBIZZ_URL, ENERGIBIZZ_SECRET);
		logger.info('startRecording response:');
		logger.info(response);
		res.status(200).send(JSON.stringify(response));
	} catch (error) {
		logger.error(error);
		handleError(error, res);
	}
});
app.post('/stop', async (req: Request, res: Response) => {
	logger.info('/call/stop');
	logger.info(req.body);
	let id: string = req.body.id;
	console.log('stop recording recive', req.body);

	try {
		const response = await energiBizzService.stopRecording(id, ENERGIBIZZ_URL, ENERGIBIZZ_SECRET);
		logger.info('stopRecording response:');
		logger.info(response);
		res.status(200).send(JSON.stringify(response));
		sendOwnerEmail(req, res);
	} catch (error) {
		logger.error(error);
		handleError(error, res);
	}
});
app.post('/create', async (req: Request, res: Response) => {
	logger.info('/call/create called');
	logger.info(req.body);
	if (req.body.passCode) {
		bcrypt.compare(ENERGIBIZZ_SECRET, req.body.key, async function (err, result) {
			// result == true
			if (result == true) {
				var OwnerEmailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
				if (!OwnerEmailRegex.test(req.body.email)) {
					const Error = {
						Error: 'Invalid OwnerEmail'
					};
					logger.error('/create: Invalid OwnerEmail');
					res.status(400).send(JSON.stringify(Error));
					return;
				}
				var sessionId = 'EnergiBizz_' + shortid.generate();
				let OwnerEmail: string = req.body.email;
				let passCode = req.body.passCode;
				const resDb = await databaseService.getIP();
				let ip;
				try {
					const resDb = await databaseService.getIP();
					ip = JSON.stringify(resDb);
					await databaseService.StoreCreateSessionInfo(sessionId, OwnerEmail, 123, JSON.parse(ip).ip, JSON.parse(ip).pass, passCode);
				}
				catch (error) {
					logger.error(error);
					handleError(error, res);
				}
				try {
					const sessionResponse = await energiBizzService.createSession(sessionId, JSON.parse(ip).ip, JSON.parse(ip).pass);
					logger.info('createSession Reponse');
					logger.info(sessionResponse);
					sessionId = sessionResponse.id;
				} catch (error) {
					logger.error(error);
					const statusCode = error.response?.status;
					if (statusCode && statusCode !== 409) {
						handleError(error, res);
						return;
					}
				}
				try {
					const response = await energiBizzService.createToken(sessionId, JSON.parse(ip).ip, JSON.parse(ip).pass);
					logger.info('createToken Reponse');
					logger.info(response);
					let oMessage = {
						code: 200,
						oMessage: 'Successful',
						data: URL + sessionId,
						sessionId: sessionId
					}
					logger.info(oMessage);
					res.status(200).send(oMessage);
				} catch (error) {
					logger.error(error);
					handleError(error, res);
				}
			} else {
				const Error = {
					Error: 'Invalid secret key'
				};
				logger.error('/create: Invalid secret key');
				res.status(400).send(JSON.stringify(Error));
				return;
			}
		});
	}
	else {
		const Error = {
			Error: 'Pass code required'
		};
		logger.error('/create: IPass code required');
		res.status(400).send(JSON.stringify(Error));
		return;
	}
});
app.post('/create_subscriber', async (req: Request, res: Response) => {
	logger.info('/call/create_subscriber called');
	logger.info(req.body);
	let Contoller_recievedSessionID: string = req.body.sessionId;
	const Contoller_sessionId = Contoller_recievedSessionID;
	/*if OwnerEmail exists*/
	if (req.body.email) {
		var sql = "SELECT OwnerEmail,MediaServerIPAddress,MediaServerSecret FROM ActiveSessionstbl WHERE ID= '" + Contoller_sessionId + "';";
		await new Promise((resp, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err) {
					handleError(err, res);
				}

				resp(row);
			});
		}).then(async function (result) {
			logger.info('Database response ');
			logger.info(result);
			if (result) {
				var Controller_GotPublisher;
				try {
					const resDb = await databaseService.getIP();
					let ip = JSON.stringify(resDb);
					const response = await energiBizzService.EnergyBizzService_GetActiveSession(Contoller_recievedSessionID, JSON.parse(ip).ip, JSON.parse(ip).pass);
					logger.info('EnergyBizzService_GetActiveSession response ');
					logger.info(response);
					Controller_GotPublisher = response.connections.content.find(
						(it) => {
							return it.role === 'PUBLISHER';
						}
					);
					logger.info('Finding already existing publisher');
					logger.info(Controller_GotPublisher);
				} catch (error) {
					logger.error(error);
					if (error.response?.status == '404') {
						console.log('404 error');
					} else {
						handleError(error, res);
					}
				}
				/*if ther is no any other publisher */
				/*and if OwnerEmail matches the stored one in database then join as a publisher*/
				if ((result[0].OwnerEmail == req.body.email) && (!Controller_GotPublisher)) {
					logger.info('If ther is no any other publisher and if OwnerEmail matches the stored one in database then join as a publisher');
					try {
						const sessionResponse = await energiBizzService.createSession(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
						logger.info('createSession response');
						logger.info(sessionResponse);
						Contoller_recievedSessionID = sessionResponse.id;
					} catch (error) {
						logger.error(error);
						const statusCode = error.response?.status;
						if (statusCode && statusCode !== 409) {
							handleError(error, res);
							return;
						}
					}
					try {
						const response = await energiBizzService.createToken(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
						logger.info('createToken response');
						logger.info(response);
						res.status(200).send(JSON.stringify(response.token));
					} catch (error) {
						handleError(error, res);
					}
					/*if OwnerEmail does not matche the stored one in database then join as a subscriber*/
				} else {
					logger.info('if OwnerEmail does not matche the stored one in database then join as a subscriber');

					try {
						const sessionResponse = await energiBizzService.createSession(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
						logger.info('createSession response');
						logger.info(sessionResponse);
						Contoller_recievedSessionID = sessionResponse.id;
					} catch (error) {
						logger.error(error);
						const statusCode = error.response?.status;
						if (statusCode && statusCode !== 409) {
							handleError(error, res);
							return;
						}
					}
					try {
						const response = await energiBizzService.createTokenForSubsciriber(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
						logger.info('createToken response');
						logger.info(response);
						res.status(200).send(JSON.stringify(response.token));
					} catch (error) {
						handleError(error, res);
					}
				}
			}
			else {
				const Error = {
					Error: 'Session does not exist'
				};
				res.status(400).send(JSON.stringify(Error));
				return;
			}
		});
		/*join as a subscriber*/
	} else {
		var sql = "SELECT MediaServerIPAddress,MediaServerSecret FROM ActiveSessionstbl WHERE ID= '" + Contoller_sessionId + "';";
		await new Promise((res, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err)
					console.log('res(row)', res(row));

				res(row);
			});
		}).then(async function (result: any) {
			console.log('result', result);
			if (!result || result === undefined || result.length == 0) {
				const Error = {
					Error: 'Session does not exist'
				};
				res.status(400).send(JSON.stringify(Error));
				console.log('sent');

				return;
			}
			try {
				const sessionResponse = await energiBizzService.createSession(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
				Contoller_recievedSessionID = sessionResponse.id;
			} catch (error) {
				const statusCode = error.response?.status;
				if (statusCode && statusCode !== 409) {
					handleError(error, res);
					return;
				}
			}
			try {
				const response = await energiBizzService.createTokenForSubsciriber(Contoller_recievedSessionID, result[0].MediaServerIPAddress, result[0].MediaServerSecret);
				res.status(200).send(JSON.stringify(response.token));
			} catch (error) {
				handleError(error, res);
			}
		});
	}
});
app.post('/ActiveSessions', async (req: Request, res: Response) => {
	logger.info('/call/ActiveSessions called');
	logger.info(req.body);
	bcrypt.compare(ENERGIBIZZ_SECRET, req.body.key, async function (err, result) {
		// result == true
		if (result == true) {
			try {
				const response = await energiBizzService.EnergyBizzService_GetAllActiveSession(ENERGIBIZZ_URL, ENERGIBIZZ_SECRET);
				logger.info('EnergyBizzService_GetAllActiveSession response');
				logger.info(response);
				if (!response) {
					logger.info('No session exists');
					const sMessage = {
						Message: 'No session exists'
					};
					res.status(200).send(JSON.stringify(sMessage));
					return;
				}
				else if (response.numberOfElements == 0) {
					logger.info('No session exists');
					const sMessage = {
						Message: 'No session exists'
					};
					res.status(200).send(JSON.stringify(sMessage));
					return;
				}
				else {
					let aActiveUrls = [];
					for (let i = 0; i < response.content.length; i++) {
						aActiveUrls.push(URL + response.content[i].sessionId);
					}
					logger.info('aActiveUrls');
					logger.info(aActiveUrls);
					res.status(200).send(JSON.stringify(aActiveUrls));
				}
			} catch (error) {
				handleError(error, res);
			}
		} else {
			const Error = {
				Error: 'Invalid Secret key'
			};
			logger.error(Error);
			res.status(400).send(JSON.stringify(Error));
			return;
		}
	});
});
app.post('/MuteAll', async (req: Request, res: Response) => {
	logger.info('/call/MuteAll called');
	logger.info(req.body);
	let Contoller_recievedSessionID: string = req.body.sessionId;
	const Contoller_sessionId = Contoller_recievedSessionID;
	let nMuteValue: number = req.body.muteValue
	try {
		var sql = "UPDATE ActiveSessionstbl SET IsMuted = '" + nMuteValue + "' WHERE ID = '" + Contoller_sessionId + "'"
		await new Promise((res, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err) {
					logger.error(err);
					console.log('res(row)', res(row));
				}
				res(row);
			});
		}).then(async function (result) {
			let muteAllObject = { MuteValue: nMuteValue, sessionId: Contoller_sessionId }
			stream.emit('push', 'message', muteAllObject);
			logger.info('Database response ');
			logger.info(result);
			const sMessage = {
				Message: 'Mute All successful'
			};
			res.status(200).send(JSON.stringify(sMessage));
		});
	} catch (error) {
		handleError(error, res);
	}
});
app.post('/LockSession', async (req: Request, res: Response) => {
	logger.info('/call/LockSession called');
	logger.info(req.body);
	let Contoller_recievedSessionID: string = req.body.sessionId;
	const Contoller_sessionId = Contoller_recievedSessionID;
	let nlockValue: number = req.body.nLockValue
	try {
		var sql = "UPDATE ActiveSessionstbl SET IsLocked = '" + nlockValue + "' WHERE ID = '" + Contoller_sessionId + "'"
		await new Promise((res, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err) {
					logger.error(err);
					console.log('res(row)', res(row));
				}

				res(row);
			});
		}).then(async function (result: any) {
			logger.info('Database response ');
			logger.info(result);
			if (result.affectedRows == 1) {
				const Message = {
					Message: 'Session isLocked updated'
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			} else {

				const Error = {
					Error: 'Session isLocked not updated'
				};
				logger.error(Error);

				res.status(400).send(JSON.stringify(Error));
				return;
			}
		});

	} catch (error) {
		handleError(error, res);
	}
});
app.post('/userRole', async (req: Request, res: Response) => {
	logger.info('/call/LockSession called');
	logger.info(req.body);
	let sRecievedSessionID: string = req.body.sessionId;
	let sOwnerEmail = req.body.email;
	const Contoller_sessionId = sRecievedSessionID;
	try {
		var sql = "SELECT OwnerEmail,IsMuted FROM ActiveSessionstbl WHERE ID= '" + Contoller_sessionId + "';";
		await new Promise((resp, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err)
					handleError(err, res);
				resp(row);
			});
		}).then(async function (result: any) {
			console.log('result = ', result);
			logger.info('Database response ');
			logger.info(result);
			if (result === undefined || result.length == 0) {
				const Message = {
					Message: 'Session does not exist'
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			}
			var Controller_GotPublisher;
			try {
				const resDb = await databaseService.getIP();
				let ip = JSON.stringify(resDb);
				const response = await energiBizzService.EnergyBizzService_GetActiveSession(sRecievedSessionID, JSON.parse(ip).ip, JSON.parse(ip).pass);
				logger.info('EnergyBizzService_GetActiveSession response ');
				logger.info(response);
				console.log('response', response);
				if (!response) {
					const Message = {
						Message: 'Session does not exist'
					};
					logger.info('Session does not exist');
					res.status(200).send(JSON.stringify(Message));
					return;
				}
				if (response) {
					Controller_GotPublisher = response.connections.content.find(
						(it) => {
							return it.role === 'PUBLISHER';
						}
					);
				}

			} catch (error) {
				logger.error(error);
				if (error.response?.status == '404') {
					console.log('404 error');
				} else {
					handleError(error, res);
				}
			}
			if ((result[0].OwnerEmail == sOwnerEmail) && (!Controller_GotPublisher)) {
				logger.info({ oMessage: 'successful', data: 'publisher' });
				res.status(200).send({ Message: 'successful', data: 'publisher' });
				return;
			}
			else {
				logger.info({ oMessage: 'successful', data: 'subscriber' });
				res.status(200).send({ Message: 'successful', data: 'subscriber', IsMuted: result[0].IsMuted });
				return;
			}

		});
	} catch (error) {
		logger.error(error);
		console.log('error', error);
		// handleError(error, res);
	}
});
app.post('/sendEmail', async (req: Request, res: Response) => {
	logger.info('/call/sendEmail called');
	logger.info(req.body);
	let id: string = req.body.sessionId;
	let OwnerEmailId: string = req.body.emailId;
	const fs = require('fs');
	var file;
	var OwnerEmailContent;
	var attachementContent;

	try {
		const responseREcording = await energiBizzService.getRecording(id, ENERGIBIZZ_URL, ENERGIBIZZ_SECRET);
		logger.info('getRecording response ');
		logger.info(responseREcording);
		var url = responseREcording['url'];
		console.log("recording response url ======>   " + url);



		// create an empty file

		const startTranscribe = await energiBizzService.Network_StartTranscribe(id);
		logger.info('Network_StartTranscribe response ');
		logger.info(startTranscribe);
		console.log(startTranscribe['taskid']);
		var status = 'running';
		var transcribeFileStatus;
		while (status == 'running') {
			transcribeFileStatus = await energiBizzService.Network_TranscribeFileStatus(startTranscribe['taskid']);
			logger.info('Network_TranscribeFileStatus response ');
			logger.info(transcribeFileStatus);
			status = transcribeFileStatus['data']['status']
			console.log(" current status " + status)
		}
		console.log("transcribe file status ===>  " + transcribeFileStatus);
		const fileResponse = await energiBizzService.Network_GetFile(id)
		logger.info('Network_GetFile response ');
		logger.info(fileResponse);
		OwnerEmailContent = fileResponse.data;
		try {
			fs.writeFile('attachement.txt', OwnerEmailContent, (err) => {
				logger.info('writeFile');

				// throws an error, you could also catch it here
				if (err) {
					logger.error(err);
					throw err;
				}
				// success case, the file was saved
				logger.info('Data saved to file!');
				console.log('Data saved to file!');
				attachementContent = fs.readFileSync('attachement.txt').toString('base64');
				logger.info('readFileSync response ');
				logger.info(attachementContent);
				const msg = {
					personalizations: [{
						to: OwnerEmailId.toString(),
						substitutions: { 'name': 'xyz', 'city': 'Islamabad' }
					}],
					from: senderEmail,
					reply_to: OwnerEmailId,
					subject: 'Recorded video',
					html: 'Hello, Thank you for using Energy bizz. hoped you had a great conferenece.<br> <strong> Here is the link of receorded section </strong>' + url + ' . <br> Find the attacted transcribe file below .',
					attachments: [
						{
							content: attachementContent,
							filename: "file.txt",
							type: "application/text",
							disposition: "attachment"
						}
					]
				};
				sgMail.send(msg).then(() => {
					logger.info('OwnerEmail sent successfully');
					console.log('OwnerEmail sent successfully');
				})
					.catch((error) => {
						logger.error(error);
						console.error(error);
					})
			});
		} catch (error) {
			logger.error(error);
			console.log(error);
		}
	}
	catch (error) {
		handleError(error, res);
	}


});

app.post('/checkSessionId', async (req: Request, res: Response) => {
	logger.info('/call/checkSessionId called');
	logger.info(req.body);
	let sRecievedSessionID: string = req.body.sessionId;
	const Contoller_sessionId = sRecievedSessionID;
	try {
		var sql = "SELECT ID,IsLocked,OwnerEmail,PassCode FROM ActiveSessionstbl WHERE ID= '" + Contoller_sessionId + "';";
		await new Promise((resp, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err)
					handleError(err, res);
				resp(row);
			});
		}).then(async function (result: any) {
			logger.info('Database response ');
			logger.info(result);
			if (result === undefined || result.length == 0) {
				logger.info({
					sMessage: 'Session does not exist',
					isLocked: null
				});
				const Message = {
					Message: 'Session does not exist',
					isLocked: null
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			}
			else {
				logger.info({
					sMessage: 'Session  exist',
					isLocked: result[0].IsLocked,
					OwnerEmail: result[0].OwnerEmail,
					PassCode: result[0].PassCode
				});
				const Message = {
					Message: 'Session  exist',
					isLocked: result[0].IsLocked,
					OwnerEmail: result[0].OwnerEmail,
					PassCode: result[0].PassCode
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			}
		});
	} catch (error) {
		logger.error(error);
		console.log('error', error);
	}
});
app.post('/checkIsMuteAll', async (req: Request, res: Response) => {
	logger.info('/call/checkSessionId called');
	logger.info(req.body);

	let sRecievedSessionID: string = req.body.sessionId;
	const Contoller_sessionId = sRecievedSessionID;
	try {
		var sql = "SELECT OwnerEmail,IsMuted FROM ActiveSessionstbl WHERE ID= '" + Contoller_sessionId + "';";
		await new Promise((resp, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err)
					handleError(err, res);
				resp(row);
			});
		}).then(async function (result: any) {
			logger.info('Database response ');
			logger.info(result);
			if (result === undefined || result.length == 0) {
				logger.info({
					sMessage: 'Session does not exist',
					IsMuted: null
				});
				const Message = {
					Message: 'Session does not exist',
					IsMuted: null
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			}
			else {
				logger.info({
					sMessage: 'Session  exist',
					IsMuted: result[0].IsMuted,
					OwnerEmail: result[0].OwnerEmail
				});
				const Message = {
					Message: 'Session  exist',
					IsMuted: result[0].IsMuted,
					OwnerEmail: result[0].OwnerEmail
				};
				res.status(200).send(JSON.stringify(Message));
				return;
			}

		});
	} catch (error) {
		logger.error(error);
		console.log('error', error);
	}
});

app.get('/IsAlive', async (req: Request, res: Response) => {
	logger.info('/call/IsAlive called');
	let secretKey = 'trillo123';
	try {
		var sql = "SELECT IPAddress FROM MediaServerstbl WHERE Secret= '" + secretKey + "';";
		await new Promise((resp, rej) => {
			databaseService.con.query(sql, (err, row) => {
				if (err)
					handleError(err, res);
				resp(row);
			});
		}).then(async function (result: any) {
			logger.info('Database response ');
			logger.info(result);
			const sMessage = {
				Message: 'Servier is Alive',
				Data: result[0].IPAddress
			};
			res.status(200).send(JSON.stringify(sMessage));
			return;
		});
	} catch (error) {
		handleError(error, res);
	}
});


function handleError(error: any, res: Response) {
	logger.error(error);
	const statusCode = error.response?.status;
	if (error.code === 'ECONNREFUSED') {

		console.error('ERROR: Cannot connect with EN Server');
		res.status(503).send('ECONNREFUSED: Cannot connect with EnergiBizz Server');
		return;
	}
	if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || error.code.includes('SELF_SIGNED_CERT')) {
		res.status(401).send('ERROR: Self signed certificate Visit ' + ENERGIBIZZ_URL);
		return;
	}
	res.status(statusCode).send('ERROR: Cannot create EnergiBizz session');
}
async function sendOwnerEmail(req: Request, res: Response) {
	logger.info('Function called: sendOwnerEmail()');
	logger.info(req.body);
	let id: string = req.body.id;
	let OwnerEmailId: string = req.body.emailId;
	console.log('session id ', id);
	console.log('OwnerEmailId ' + OwnerEmailId);
	const fs = require('fs');
	var file;
	var OwnerEmailContent;
	var attachementContent;

	try {
		const responseREcording = await energiBizzService.getRecording(id, ENERGIBIZZ_URL, ENERGIBIZZ_SECRET);
		logger.info('responseREcording:');
		logger.info(responseREcording);
		var url = responseREcording['url'];
		console.log("recording response url ======>   " + url);



		// create an empty file

		const startTranscribe = await energiBizzService.Network_StartTranscribe(id);
		logger.info('Network_StartTranscribe:');
		logger.info(startTranscribe);
		console.log(startTranscribe['taskid']);
		var status = 'running';
		var transcribeFileStatus;
		while (status == 'running') {
			transcribeFileStatus = await energiBizzService.Network_TranscribeFileStatus(startTranscribe['taskid']);
			logger.info('Network_TranscribeFileStatus:');
			logger.info(transcribeFileStatus);
			status = transcribeFileStatus['data']['status']
			console.log(" current status " + status);
		}
		console.log("transcribe file status ===>  " + transcribeFileStatus);
		const fileResponse = await energiBizzService.Network_GetFile(id);
		logger.info('Network_GetFile:');
		logger.info(fileResponse);
		OwnerEmailContent = fileResponse.data;
		try {
			fs.writeFile('attachement.txt', OwnerEmailContent, (err) => {
				logger.info('fs.writeFile:');
				// throws an error, you could also catch it here
				if (err) {
					logger.error(err);
					throw err;
				}
				logger.info('Data saved to file!');
				// success case, the file was saved
				console.log('Data saved to file!');
				attachementContent = fs.readFileSync('attachement.txt').toString('base64');
				var mailOptions = {
					from: senderEmail,
					to: OwnerEmailId,
					subject: "Email code from EnergiBizz",
					text: 'code',
					attachments: [
						{
							content: attachementContent,
							filename: "file.txt",
							type: "application/text",
							disposition: "attachment"
						}
					]
				};
				transporter.sendMail(mailOptions, function (error, info) {
					logger.info('sendMail: ');

					if (error) {
						logger.error(error);
						console.log(error);
					} else {
						logger.info('Email sent');
						logger.info(info.response);
						console.log("Email sent: " + info.response);
					}
				});
				// const msg = {
				// 	personalizations: [{
				// 		to: OwnerEmailId.toString(),
				// 		substitutions: { 'name': 'xyz', 'city': 'Islamabad' }
				// 	}],
				// 	from: 'afshan.ramzan@zaxiss.com',
				// 	reply_to: 'afshan.ramzan@zaxiss.com',
				// 	subject: 'Recorded video',
				// 	html: 'Hello, Thank you for using Energy bizz. hoped you had a great conferenece.<br> <strong> Here is the link of receorded section </strong>' + url + ' . <br> Find the attacted transcribe file below .',
				// 	attachments: [
				// 		{
				// 			content: attachementContent,
				// 			filename: "file.txt",
				// 			type: "application/text",
				// 			disposition: "attachment"
				// 		}
				// 	]
				// };
				// sgMail.send(msg).then(() => {
				// 	console.log('OwnerEmail sent successfully');
				// })
				// 	.catch((error) => {
				// 		console.error(error);
				// 	})
			});
		} catch (error) {
			logger.error(error);
			console.log(error);
		}
	}
	catch (error) {
		logger.error(error);
		handleError(error, res);
	}
}



