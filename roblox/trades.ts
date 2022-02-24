import superagent = require('superagent');
import RobloxTrade from "../interfaces/RobloxTrade";
import print from "../print";
import chalk from "chalk";

export default function (tradeId, cookie): Promise<RobloxTrade | null> {
    return new Promise<RobloxTrade | null>(resolve => {
        superagent('GET', 'https://trades.roblox.com/v1/trades/' + tradeId)
            .set('cookie', `.ROBLOSECURITY=${cookie}`)
            .set('content-type', 'application/json')
            .then(resp => {
                if (!resp.body) return resolve(null);
                const {body} = resp;

                return resolve(body);
            })
            .catch(err => {
                const body = err.response.body;
                if (!body) return resolve(null);

                if (body.errors) {
                    if (body.errors[0].message === 'TooManyRequests')
                        print(chalk.yellow('[~] ratelimited when attempting to reach the trade api, posting tags instead'))
                    else
                        print(chalk.yellow(`[~] error when attempting to reach the trade api (${body.errors[0].message}), posting tags instead`))
                } else print(chalk.redBright('[!] failed to fetch outbounds, posting tags instead'))

                resolve(null);
            })
    })
}