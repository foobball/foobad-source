import config, {setRobloxCookie, setRoProCookie} from './config';
import print from './print';
import chalk from "chalk";
import reloadProfile from "./rolimons/reloadProfile";
import {refreshItemCache, getItem, getEntireItemCache} from "./rolimons/itemValues";
import postad from "./rolimons/postAd";
import superagent from 'superagent';
import {adPosted, checkWebhooks, twoFAneeded, webhookPostError} from "./discord";
import {basicInfo} from "./interact/retrieveinfo";
import validateCookie from "./roblox/validateCookie";
import csrf from "./roblox/csrf";
import getOutbounds from './roblox/outbounds';
import trades from "./roblox/trades";
import need2fa from "./roblox/needs2fa";
import getTradeAdCooldown from "./rolimons/getTradeAdCooldown";

import getRoProSession from "./ropro/getRoProSession";
import getSubscription from "./ropro/getSubscription";
import postRoProTradeAd from "./ropro/postRoProTradeAd";

import Account from "./interfaces/Account";
import RoProProfile from "./interfaces/RoProProfile";

const version = `2.1.0`;
let adsPosted = 0;

const setTitle = (text = '') => require('console-title')('foobad // v' + `${version}${text ? ` // ${text}` : ''}`);
setTitle('warming up 😁')

setInterval(() => {
}, 1000);

const oldexit = process.exit;
// @ts-ignore
process.exit = () => {
    process['halted'] = true;
    print(chalk.blueBright(`~-~-~-~ press `) + chalk.redBright(`[CTRL + C]`) + chalk.blueBright(` to close ~-~-~-~`));

    setTitle('stopped ❌');

    webhookPostError('foobad stopped', 'foobad has stopped running')

    /*
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', oldexit.bind(process, 0));
    */
}

process.on('unhandledRejection', (err, p) => {
    print(chalk.yellow('[~] internal error, debug shown below:'));
    console.log(`Rejected Promise:`);
    console.log(p);
    console.log(`Rejection:`);
    console.log(err);

    print(chalk.redBright(`[!] ^^^ PLEASE REPORT THE ABOVE MESSAGE TO foob#9889 ^^^`));

    webhookPostError('Internal error', 'Please check the console for more information.');
});

process.on('uncaughtException', (err, p) => {
    print(chalk.redBright('[~] internal error, debug shown below:'));
    console.log(`Exception Origin:`);
    console.log(p);
    console.log(`Exception:`);
    console.log(err);

    print(chalk.redBright(`[!] ^^^ PLEASE REPORT THE ABOVE MESSAGE TO foob#9889 ^^^`));

    webhookPostError(`Internal error caught`, `\`\`\`${err}\n\n>> Please report this to foob#9889 <<\`\`\``)
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const getRandomNumber = max => Math.floor(Math.random() * max);
const getRandomNumberInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * I copied the following code snipped from stackoverflow
 * and it literally barely works lol.
 */
const shuffle = array => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

print(chalk.blueBright(
    ` .o88o.                      .o8                       .o8  
 888 \`"                     "888                      "888  
o888oo   .ooooo.   .ooooo.   888oooo.   .oooo.    .oooo888  
 888    d88' \`88b d88' \`88b  d88' \`88b \`P  )88b  d88' \`888  
 888    888   888 888   888  888   888  .oP"888  888   888  
 888    888   888 888   888  888   888 d8(  888  888   888  
o888o   \`Y8bod8P' \`Y8bod8P'  \`Y8bod8P' \`Y888""8o \`Y8bod88P"
v${version}`
));

const tradeAdThread = async (account: Account | RoProProfile, ropro = false, delay?: number) => {
    if (process['halted']) return;

    try {
        if (!ropro) {
            const cooldown = await getTradeAdCooldown(account.cookie);
            if (cooldown > 0 && cooldown !== 5) {
                print(`[${account.username}] ` + chalk.blueBright(`[i] waiting ${Math.round(cooldown)} minute${Math.round(cooldown) == 1 ? '' : 's'} before posting another rolimons trade ad`))
                return setTimeout(() => {
                    tradeAdThread(account);
                }, (cooldown) * 60 * 1000);
            }
        }

        const body = await reloadProfile(account.id);
        if (!body || !body.playerAssets) {
            print(`[${account.username}]` + chalk.redBright(` [!] no rolimons profile found, could be a rolimons issue or your profile is unclaimed`))
            print(`[${account.username}]` + chalk.blueBright(` [i] waiting 15 minutes before retrying ...`))

            return setTimeout(() => {
                tradeAdThread(account);
            }, 15 * 60 * 1000);
        }
        const configCache = await config();
        let toRequest = [];

        let ownedAssetIds = [];
        for (const assetId of Object.keys(body.playerAssets)) {
            if (configCache.item_give_blacklist.indexOf(Number(assetId)) == -1)
                ownedAssetIds.push(Number(assetId));
        }

        let toList = [];
        for (const assetId of configCache.item_give_prioritize) {
            if (ownedAssetIds.indexOf(Number(assetId)) > -1)
                toList.push(Number(assetId));
        }

        const maxToGive = getRandomNumberInclusive(
            configCache.item_give_min_amount,
            configCache.item_give_max_amount
        )

        for (const ownedAssetId of shuffle(ownedAssetIds)) {
            if (toList.indexOf(Number(ownedAssetId)) > -1) continue;
            if (toList.length >= maxToGive) continue;
            toList.push(ownedAssetId);
        }

        toList = shuffle(toList.slice(0, (maxToGive > 4 ? 4 : maxToGive)));

        let adBody = {
            player_id: account.id,
            offer_item_ids: toList,
            request_item_ids: [],
            request_tags: []
        };

        let requestTags = configCache.only_request_tags || !account.rblxcookie;
        if (!requestTags) {
            const randomNumber = getRandomNumberInclusive(0, 100);
            const chance = configCache.tag_request_percent || 0;
            requestTags = (randomNumber <= chance);
        }

        if (!requestTags) {
            const usersOutbounds = await getOutbounds(account.rblxcookie);
            if (!usersOutbounds || usersOutbounds.length < 3) {
                requestTags = true;
            } else {
                const selectedTrade = getRandomNumberInclusive(0, usersOutbounds.length - 1);
                const tradeMetadata = usersOutbounds[selectedTrade];

                if (tradeMetadata) {
                    const tradeData = await trades(tradeMetadata.id, account.rblxcookie);
                    if (tradeData) {
                        const offers = tradeData.offers;
                        let requestOffer = [];
                        let sendingOffer = [];
                        for (const offer of offers) {
                            if (offer.user.id == account.id) {
                                for (const asset of offer.userAssets) {
                                    if (!body.playerAssets[asset.assetId])
                                        requestTags = true;
                                    sendingOffer.push(asset.assetId);
                                }
                            } else
                                for (const asset of offer.userAssets)
                                    requestOffer.push(asset.assetId)
                        }

                        if (!requestTags) {
                            adBody.request_item_ids = requestOffer;
                            adBody.offer_item_ids = sendingOffer;
                        }
                    } else requestTags = true;
                } else requestTags = true;
            }
        }

        let totalValue = 0

        let setTotalValue = () => {
            for (const id of toList) {
                let Item = getItem(Number(id))
                totalValue += Item ? Item.actual_value : 0
            }
        }


        // hell begins here
        requestTags ?
            toList.length < 2 ?
                setTotalValue() : null : null;

        totalValue < 1100 ?
            adBody.request_tags = ['any'] :
            totalValue < 1600 ?
                configCache.use_any_tag_only_when_needed ?
                    adBody.request_tags = ['downgrade'] :
                    adBody.request_tags = ['any', 'downgrade'] :
                adBody.request_tags = ['downgrade']

        toList.length > 1 ?
            configCache.use_any_tag_only_when_needed ?
                adBody.request_tags = ['upgrade'] :
                adBody.request_tags = ['any', 'upgrade'] : null

        toList.length >= 3 ?
            adBody.request_tags = ['upgrade'] : null
        // hell ends here

        if (configCache.tag_override.length >= 1) {
            if (!configCache.use_complete_tag_override) {
                for (const tag of configCache.tag_override)
                    if (adBody.request_tags.indexOf(tag) == -1)
                        adBody.request_tags.push(tag);
            } else adBody.request_tags = shuffle(shuffle(shuffle(configCache.tag_override)));
        }

        if (ropro) {
            const adPostResponse = await postRoProTradeAd(account.cookie, adBody);

            if (adPostResponse.error) {
                print(`[${account.username}]` + chalk.redBright(` [!] error during ropro request: ${adPostResponse.resp || 'unknown error'}`));
                print(`[${account.username}]` + chalk.blueBright(` [i] waiting [${delay || 20}] minutes before retrying ...`));

                return setTimeout(() => {
                    tradeAdThread(account, ropro, delay);
                }, (delay || 20) * 60 * 1000);
            }
        } else {
            const adPostResponse = await postad(account.cookie, adBody);
            if (!adPostResponse.success) {
                if (adPostResponse.resp) {
                    if (adPostResponse.resp === 'verification error (422)') {
                        print(`[${account.username}]` + chalk.redBright(` [!] invalid rolimon's cookie, stopping thread`));
                        webhookPostError(
                            `Invalid Rolimon's cookie`,
                            `The cookie for the account [${account.username}] is invalid.\n` +
                            `(expired @ ${account.exp.toLocaleString()})`
                        );
                        return;
                    }
                }

                print(`[${account.username}]` + chalk.redBright(` [!] error during rolimons request: ${adPostResponse.resp}`));
                if (adPostResponse.resp === 'ad creation cooldown has not elapsed (400)') {
                }

                print(`[${account.username}]` + chalk.blueBright(` [i] waiting [5] minutes before retrying ...`));

                return setTimeout(() => {
                    tradeAdThread(account, ropro, delay);
                }, 5 * 60 * 1000);
            }

        }

        adsPosted++;
        setTitle(`running // ${adsPosted.toLocaleString()} trade ad${adsPosted == 1 ? '' : 's'} posted`)

        // posts webhook message
        adPosted(account, adBody, ropro);

        let offeringArr = [];
        let requestingArr = [];
        for (const offerId of adBody.offer_item_ids) {
            const itemData = getItem(offerId);
            if (!itemData) {
                offeringArr.push(offerId);
                continue;
            }

            offeringArr.push(itemData.name);
        }

        for (const wantId of adBody.request_item_ids) {
            const itemData = getItem(wantId);
            if (!itemData) {
                requestingArr.push(wantId);
                continue;
            }

            requestingArr.push(itemData.name);
        }
        for (const tag of adBody.request_tags)
            requestingArr.push(tag.toUpperCase());

        const firstLine = `[${account.username}]` +
            chalk.cyanBright(` [/] offering [`) +
            chalk.cyan(offeringArr.join(', ')) +
            chalk.cyanBright('] for [') +
            chalk.cyan(requestingArr.join(', ')) +
            chalk.cyanBright(']');

        const waitTime = delay || configCache.post_delay;
        const waitTimeVar = Math.round(getRandomNumber(configCache.post_delay_variance + 1));
        print(firstLine);
        print(`[${account.username}] ` + chalk.green(`[+] ${ropro ? 'ropro' : 'rolimons'} trade ad posted, waiting [${waitTime + waitTimeVar}] minutes ...`));

        setTimeout(() => {
            tradeAdThread(account, ropro, delay);
        }, (waitTime + waitTimeVar) * 60 * 1000);
    } catch (e) {
        console.error(e);
        print(chalk.redBright(`[!] debug error message above`));

        webhookPostError('Internal request error', `${e}\n\nCheck the console for more information.`)

        print(`[${account.username}]` + chalk.redBright(` [!] failed to post trade ad due to external request error`));
        print(`[${account.username}]` + chalk.blueBright(` waiting [2] minutes before retrying ...`));

        return setTimeout(() => {
            tradeAdThread(account, ropro, delay);
        }, 2 * 60 * 1000);
    }
}
const onlineThread = async (robloxAccount: any) => {
    if (process['halted']) return;

    const fetchedCSRFToken = await csrf(robloxAccount.cookie);
    if (!fetchedCSRFToken) {
        print(`[${robloxAccount.username}] ` + chalk.redBright('[!] failed to fetch csrf token, cookie may be invalidated'));

        /**
         * This part could be done MUCH better
         * It could:
         *  1.) Have a lower retry interval
         *  2.) Actually check the cookie 
         *  3.) Maybe not send a webhook message until it's entirely sure
         * 
         * I couldn't be bothered to implement that lol
         */
        webhookPostError('Always online error', `[${robloxAccount.username}] failed to set status as online, cookie may be invalid`);
        print(`[${robloxAccount.username}] ` + chalk.blueBright('[always_online] waiting [20] minutes before retrying'));
        return setTimeout(() => onlineThread(robloxAccount), 20 * 60 * 1000)
    }

    superagent.post('https://presence.roblox.com/v1/presence/register-app-presence')
        .set('cookie', `.ROBLOSECURITY=${robloxAccount.cookie}`)
        .set('x-csrf-token', fetchedCSRFToken)
        .set('content-type', 'application/json')
        .send({location: "Friends"})
        .then(() => {
            setTimeout(() => onlineThread(robloxAccount), getRandomNumberInclusive(60, 120) * 1000);
        })
        .catch(reason => {
            print(`[${robloxAccount.username}] [always_online] ` + chalk.blueBright(`failed (${reason.status || '0'}), waiting [5] minutes before retrying`));
            return setTimeout(() => onlineThread(robloxAccount), 5 * 60 * 1000)
        })
}
const check2faThread = async (robloxAccount: any) => {
    if (process['halted']) return;
    const is2faNeeded = await need2fa(robloxAccount.cookie);

    if (is2faNeeded) {
        twoFAneeded(robloxAccount.username);
        print(`[${robloxAccount.username}] ` + chalk.redBright(`[!] Roblox is requesting 2FA verification, complete this at https://roblox.com/my/account#!/security`));
        setTimeout(() => check2faThread(robloxAccount), 24 * 60 * 60 * 1000)
    } else setTimeout(() => check2faThread(robloxAccount), 5 * 60 * 1000)
}

export const main = async () => {
    print(chalk.yellow('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'))
    let configCache = await config();
    if (!configCache) return;

    print(chalk.yellow('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'))
    print(chalk.blueBright('[i] authenticating with foobad servers...'))
    
    /**
     * for getting whitelist info from my servers, the line below was used.
     * as this copy has some encryption stuff changed and removed,
     * it will error if you actually try connecting to my servers.
     * 
     * const dataCheck = await basicInfo();
     */


    const dataCheck = {
        discordTag: 'foob#9889',
        discordInvite: '63Y8WEQDgw',
        latest: version
    }

    print(chalk.yellow(
        `[!] https://foobtra.de/ | made by ${dataCheck.discordTag}\n` +
        `[!] discord: https://discord.gg/${dataCheck.discordInvite}\n` +
        `[!] running v${version} | latest: v${dataCheck.latest}`
    ));

    if (version !== dataCheck.latest)
        print(chalk.redBright(`[!] you're not on the latest foobad version (v${dataCheck.latest}).`))

    print(chalk.yellow('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));

    let cookies = [];
    let roproaccounts: Array<RoProProfile> = [];
    const roprodelays = {
        free_tier: 30,
        standard_tier: 15,
        pro_tier: 5,
        ultra_tier: 5,
    };

    let i = 1;
    for (const cookie of configCache.roblox_cookies || []) {
        const testCookie = await validateCookie(cookie);

        if (!testCookie.valid)
            print(chalk.redBright(`[!] roblox cookie #${i} is invalid`))
        else {
            print(chalk.green(`[+] loaded roblox account [${testCookie.username}] (${testCookie.id})`));
            for (let i = 0; i < configCache.accounts.length; i++) {
                const account = configCache.accounts[i];

                if (account.id == testCookie.id) {
                    configCache = setRobloxCookie(i, cookie);
                    print(chalk.green(`    & linked to provided rolimon's cookie`));
                }
            }

            if (configCache.post_ropro_ads) {
                const roProCookie = await getRoProSession(cookie);
                if (roProCookie) {
                    const subscriptionLevel = await getSubscription(roProCookie);
                    if (subscriptionLevel) {
                        roproaccounts.push({
                            cookie: roProCookie,
                            username: testCookie.username,
                            id: testCookie.id,
                            delay: roprodelays[subscriptionLevel],
                            exp: 0,
                            rblxcookie: cookie
                        })

                        print(chalk.green(`    & linked to ropro profile (${subscriptionLevel.replace(/_/g, ' ')})`))
                    } else print(chalk.redBright(`    & failed to link to ropro profile`))
                }
            }

            testCookie.cookie = cookie;
            cookies.push(testCookie);
        }

        await sleep(1000);
        i++;
    }

    if (configCache.stay_online) {
        print(chalk.blueBright(`[i] keeping [${cookies.length}] account${cookies.length != 1 ? 's' : ''} set as online`));

        (async () => {
            for (const cookie of cookies) {
                onlineThread(cookie);
                await sleep(30 * 1000);
            }
        })()
    }

    if (configCache.alert_on_2fa_needed) {
        print(chalk.blueBright(`[i] sending 2fa required alerts for [${cookies.length}] account${cookies.length != 1 ? 's' : ''}`));

        (async () => {
            await sleep(10 * 1000);
            for (const cookie of cookies) {
                check2faThread(cookie);
                await sleep(30 * 1000);
            }
        })();
    }

    print(chalk.yellow('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    print(chalk.blueBright('[i] checking discord webhooks...'));
    await checkWebhooks();
    print(chalk.yellow('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    await refreshItemCache();

    let accounts = configCache.accounts;

    setTitle('running // 0 trade ads posted')

    for (const account of accounts) {
        tradeAdThread(account);
        await sleep(5000);
    }

    if (configCache.post_ropro_ads) {
        for (const roproaccount of roproaccounts) {
            tradeAdThread(roproaccount, true, roproaccount.delay);
            await sleep(5000);
        }
    }
}

main();
