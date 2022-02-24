import superagent from 'superagent';
import print from "../print";
import chalk from "chalk";
import * as enc from './enc';
import config from "../config";
import {genHWID} from "./hwid";
import {webhookPostError} from "../discord";
import crypto from "crypto";

const apiroot = 'https://foobtra.de/api'

const genSalt = () => (crypto.randomBytes(127).toString('hex').toString());
export const basicInfo = () => {
    if (process['halted']) return;

    return new Promise<any>(async resolve => {
        const configCache = (await config());
        const foobsecure = configCache.foobtrade_token;
        const hwid = await genHWID();
        const encryptedData = enc.encrypt({
            hwid,
            date: Date.now(),
            s: genSalt()
        }, null, foobsecure);

        /**
         * 
         * I removed a few of my checks from this part
         * 
         */

        superagent('POST', `${apiroot}/foobad`)
            .set('cookie', `foobsecure=${foobsecure}`)
            .send({
                data: encryptedData.data
            })
            .then(async resp => {
                if (resp.body.error) {
                    console.log('');

                    if (resp.body.message === 'invalid session') {
                        print(chalk.redBright(`[!] invalid foobtrade token provided: please get your token from https://foobtra.de/dashboard`));
                        webhookPostError(`Invalidated foobtrade token`, `Please get a new foobtrade token from https://foobtra.de/dashboard then update your config.json file.`)
                    } else if (resp.body.message === 'invalid hwid') {
                        print(chalk.redBright(`[!] please update your hwid by sending the following command to robotic foob in dms:`))
                        print(chalk.yellow('~~~~~~~~~~~~~~'))
                        print(`!changehwid ${hwid}`)
                        print(chalk.yellow('~~~~~~~~~~~~~~'))
                        print(chalk.redBright(`then relaunch foobad.`));

                        webhookPostError(`HWID not whitelisted`, `Please whitelist foobad with the following command:\n!changehwid ${hwid}`)
                    } else {
                        print(chalk.redBright(`[!] failed to verify with foobad's servers: ${resp.body.message || 'unknown'}`));
                        print(chalk.redBright(`[!] make sure you are on the latest version of foobad`));

                        webhookPostError(`Failed to verify whitelist`, `Details: ${resp.body.message || 'unknown'}\nPlease make sure you're on the latest version of foobad.`)
                    }
                    return process.exit();
                }

                const {data} = resp.body;
                const decrypted = enc.decrypt(data, null, (await config()).foobtrade_token);
                if (decrypted.error) {
                    print(chalk.redBright(`[!] failed to verify with foobad's servers`));
                    print(chalk.redBright(`[!] make sure you are on the latest version of foobad`));

                    webhookPostError(`Failed to verify whitelist`, `Unable to decode server's message\nPlease make sure you're on the latest version of foobad.`)
                    return process.exit();
                }

                // recheck whitelist every 25 minutes
                setTimeout(basicInfo, 25 * 60 * 1000);

                resolve(JSON.parse(decrypted.data));
            })
            .catch(err => {
                webhookPostError(`Failed to contact foobad's servers`, `foobad status code: [${err.status || '000'}]`)

                print(chalk.redBright(`[!] failed to verify with foobad's servers (${err.status || '000'})`));
                print(chalk.redBright(`[!] this error is most likely caused by a connection issue.`));
                process.exit();
            })
    })
}