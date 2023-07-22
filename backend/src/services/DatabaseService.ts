const util = require('util');
import { Config_SQLConnection} from '../config';
import { ENERGIBIZZ_URL, ENERGIBIZZ_SECRET, URL, transporter,logConfiguration,winston } from '../config';

const logger = winston.createLogger(logConfiguration);

export class DatabaseService {


    private mysql = require('mysql');
    public con = Config_SQLConnection;
    private currentIp;
    private sessionturn = 0;
    private media_servers_ip = [];
    id ;
    constructor() {
    }
    public connectDatabase() {

        this.con.connect((err) => {
            if (err){
                logger.error('Database is not responding:',err);
                throw err;
            }
            logger.info('Database Connected');
            console.log('Connected!');
        });

        this.con.query('select IPAddress,secret FROM MediaServerstbl', async (err, rows) => {

            if (err) throw err;

            rows.forEach((row) => {
                this.media_servers_ip.push({ip:row.IPAddress,pass:row.secret})
                console.log('ips = ', this.media_servers_ip);

            });


        });


    }

    async StoreCreateSessionInfo(sessionID, OwnerEmail, OwnerID, MediaServerIPAddress,MediaServerIPAddress_pass,passCode) {
        var sql = "INSERT INTO ActiveSessionstbl (ID, OwnerID,OwnerEmail,IsLocked,IsMuted,MediaServerID,MediaServerIPAddress,MediaServerSecret,PassCode) VALUES ('" + sessionID + "','123','" + OwnerEmail + "', 0, 0, 1, '" + MediaServerIPAddress + "','" + MediaServerIPAddress_pass + "','" + passCode + "')";
        console.log('SQL Query: ', sql);
        this.con.query(sql, function (err, result) {
            if (err){
                console.log('Error adding values = ', err);
                throw err;
            }
        });

    }


    async getIP() {
        if (this.sessionturn == 0) {
            this.currentIp = this.media_servers_ip.shift();
            this.media_servers_ip.push(this.currentIp);
            this.sessionturn = 1;
            return this.currentIp;
        }
        else {
            this.sessionturn = 0;
            return this.currentIp
        }
    }

}