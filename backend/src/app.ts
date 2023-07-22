import * as express from 'express';
import { SERVER_PORT, ENERGIBIZZ_URL, ENERGIBIZZ_SECRET, CALL_ENERGIBIZZ_CERTTYPE } from './config';
import {app as callController} from './controllers/CallController';
import {DatabaseService} from './services/DatabaseService';
import * as dotenv from 'dotenv';
const EventEmitter = require('events');
const stream = new EventEmitter();
dotenv.config();
const app = express();

const database= new DatabaseService();

app.use(express.static('public'));
app.use(express.json());
app.use('/call', callController);
app.use('/call/create', callController);
app.use('/call/start', callController);
app.use('/call/stop', callController);
app.use('/call/session', callController);
app.use('/call/sendEmail', callController);
app.use('/create', callController);
app.listen(SERVER_PORT, () => {
    console.log("---------------------------------------------------------");
    console.log(" ")
    console.log(`ENERGIBIZZ URL: ${ENERGIBIZZ_URL}`);
    console.log(`ENERGIBIZZ SECRET: ${ENERGIBIZZ_SECRET}`);
    console.log(`CALL ENERGIBIZZ CERTTYPE: ${CALL_ENERGIBIZZ_CERTTYPE}`);
    console.log(`ENERGIBIZZ Call Server is listening on port ${SERVER_PORT}`);
    console.log(" ")
    console.log("---------------------------------------------------------");
    
    
});