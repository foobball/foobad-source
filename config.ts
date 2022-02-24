import * as fs from 'fs';
import print from './print'
import chalk from "chalk";
import jwtDecode from "jwt-decode";
import * as discord from './discord';

import Config from './interfaces/Config'
import RolimonCookieJWT from "./interfaces/RolimonCookieJWT";

let configCachedJSON: Config;
let configIdCache = [];

export function setRobloxCookie(i, cookie): Config {
    configCachedJSON.accounts[i].rblxcookie = cookie;
    return configCachedJSON;
}
export function setRoProCookie(i, cookie): Config {
    configCachedJSON.accounts[i].ropro = cookie;
    return configCachedJSON;
}
export function deleteRobloxCookie(userId): Config {
    for (let i = 0; i < configCachedJSON.accounts.length; i++) {
        if (configCachedJSON.accounts[i].id == userId)
            delete configCachedJSON.accounts[i].rblxcookie;
    }
    return configCachedJSON;
}

const validTags = [
    "any", "demand", "rares", "rap", "robux", "upgrade", "downgrade"
];
const defaultConfig = {
    "foobtrade_token": "get this from https://foobtra.de/dashboard",
    "rolimons_cookies": [
        "your rolimons cookie",
        "your second rolimons cookie"
    ],
    "roblox_cookies": [
        "your roblox cookie",
        "your second roblox cookie"
    ],
    "post_ropro_ads": true,

    "stay_online": true,

    "ping_on_2fa": '<@219541416760705024>',
    'alert_on_2fa_needed': true,

    "post_delay": 15,
    "post_delay_variance": 3,

    "only_request_tags": false,
    "tag_request_percent": 50,
    "use_any_tag_only_when_needed": true,
    "use_complete_tag_override": false,
    "tag_override": [],

    "item_give_prioritize": [],
    "item_give_blacklist": [],
    "item_give_min_amount": 2,
    "item_give_max_amount": 4,

    "post_webhook": "https://discord.com/blahblah",
    "error_webhook": "https://discord.com/blahblah",
    "webhook_color": "#7da7fa"
}

const hexToDecimal = hex => parseInt(hex.replace(/#/g, ''), 16);
export default function (): Promise<Config | null> | Config {
    if (configCachedJSON) return configCachedJSON;
    return new Promise<Config | null>(resolve => {
        if (!fs.existsSync('config.json')) {
            print(chalk.redBright('[!] config.json couldn\'t be found, please redownload the default one.'));
            fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, 2));
            resolve(null);
            return process.exit();
        }
        const configBuffer = fs.readFileSync('config.json').toString();
        let configJSON: Config;

        try {
            configJSON = JSON.parse(configBuffer);
        } catch {
            print(chalk.redBright('[!] failed to read config.json, it may not be properly formatted'));
            resolve(null);
            return process.exit();
        }

        let missing = [];
        for (const key of Object.keys(defaultConfig)) {
            if (configJSON[key] == null)
                missing.push(key);
        }

        if (missing.length > 0) {
            for (const key of missing) {
                configJSON[key] = defaultConfig[key];
            }

            print(chalk.redBright('[!] the following settings were missing from your config.json file:'));
            print(chalk.redBright(`[!] ${missing.join(', ')}`));
            console.log('');

            fs.writeFileSync('config.json', JSON.stringify(configJSON, null, 4));
            print(chalk.green('[+] updated your config.json file with the missing values'));
            print(chalk.green('    please check your config.json file then relaunch.'));

            return process.exit();
        }

        if (!configJSON.rolimons_cookies ||
            typeof configJSON !== 'object' ||
            configJSON.rolimons_cookies.length < 1) {
            print(chalk.redBright('[!] no rolimon\'s account cookies were provided'));
            // resolve(null);
            // return process.exit();
        }

        configJSON.accounts = [];

        let invalidFound = false;
        for (let i = 0; i < configJSON.rolimons_cookies.length; i++) {
            const cookie = configJSON.rolimons_cookies[i];
            try {
                const decodedCookieData: RolimonCookieJWT = jwtDecode(cookie);
                const account = {
                    id: decodedCookieData.player_data.id,
                    username: decodedCookieData.player_data.name,
                    cookie,
                    exp: new Date(decodedCookieData.exp * 1000),
                };

                if (configIdCache.indexOf(account.id) > -1) {
                    print(chalk.redBright(`[!] cookie #${i + 1} is a duplicate for [${account.username}] (${account.id})`))
                    continue;
                }

                configIdCache.push(account.id);

                if (Date.now() > account.exp.getTime()) {
                    print(chalk.redBright(`[!] rolimons cookie #${i + 1} is invalid: expired at ${account.exp.toLocaleString()}`));
                    invalidFound = true;
                    continue;
                }

                configJSON.accounts.push(account);

                print(chalk.green(`[+] loaded rolimons account [${account.username}] (${account.id})`));
            } catch {
                print(chalk.redBright(`[!] rolimons cookie #${i + 1} is invalid`));
                invalidFound = true;
            }
        }

        if (invalidFound && false) {
            print(chalk.redBright(`[!] please fix the invalid rolimons cookies then relaunch.`))
            resolve(null);
            return process.exit();
        }

        if (!configJSON.post_delay) {
            print(chalk.yellow('<-> no post delay specified, set to minimum of 15 minutes'));
            configJSON.post_delay = 15;
        } else if (configJSON.post_delay < 15) {
            print(chalk.yellow('<-> post delay is less than 15 minutes\nforce set to 15 minutes to avoid ratelimits'));
            configJSON.post_delay = 15;
        }

        const regColor = new RegExp("^#[a-fA-F0-9]{6}$");
        if (typeof configJSON.webhook_color !== 'string' || !configJSON.webhook_color.match(regColor)) {
            print(chalk.yellow(`[~] the webhook color provided in your config is invalid, setting to "${defaultConfig.webhook_color}"`))
            print(chalk.yellow(`    (refer to the docs at https://github.com/foobad/foobad-docs)`))
            configJSON.webhook_color = defaultConfig.webhook_color;
        }
        configJSON.webhook_color = hexToDecimal(configJSON.webhook_color);

        if (typeof configJSON.tag_override !== 'object') configJSON.tag_override = [];
        let invalidTags = [];
        let tagsToUse = [];

        for (const providedTag of configJSON.tag_override) {
            if (validTags.indexOf(providedTag.toLowerCase()) > -1)
                tagsToUse.push(providedTag.toLowerCase())
            else invalidTags.push(providedTag.toLowerCase());
        }

        if (invalidTags.length > 0) {
            print(chalk.redBright('[!] the following invalid tags were provided for the "tag_override" setting:'))
            for (const invalidTag of invalidTags) {
                print(chalk.redBright(`    ${invalidTag}`))
            }
            print(chalk.redBright(`[!] list of valid tags you can use: ${validTags.join(', ')}`))
        }

        configJSON.tag_override = tagsToUse;

        configCachedJSON = configJSON;
        resolve(configJSON);
        return configJSON;
    })

}