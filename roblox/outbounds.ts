import superagent from 'superagent';
import csrf from "./csrf";

import OutboundTrade from "../interfaces/OutboundTrade";
import print from "../print";
import chalk from "chalk";

export default function async(cookie): Promise<Array<OutboundTrade> | null> {
    return new Promise<Array<OutboundTrade> | null>(resolve => {
        superagent('GET', 'https://trades.roblox.com/v1/trades/outbound?cursor=&limit=25&sortOrder=Desc')
            .set('cookie', `.ROBLOSECURITY=${cookie}`)
            .then(resp => {
                if (!resp.body) return resolve([]);
                const {data} = resp.body;

                resolve(data);
            })
            .catch(err => {
                const body = err.response.body;
                if (!body) return resolve(null);

                if (body.errors) {
                    if (body.errors[0].message === 'TooManyRequests')
                        print(chalk.yellow('[~] ratelimited when attempting to reach the outbound trade api, posting tags instead'))
                    else
                        print(chalk.yellow(`[~] error when attempting to reach the outbound trade api (${body.errors[0].message}), posting tags instead`))
                } else print(chalk.redBright('[!] failed to fetch outbounds, posting tags instead'))

                resolve(null);
            })
    })
}