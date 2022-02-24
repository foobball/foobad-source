import superagent from 'superagent';
import config from "./config";
import print from "./print";
import chalk from "chalk";
import thumbnails from "./roblox/thumbnails";
import AdBody from "./interfaces/AdBody";
import {getItem} from "./rolimons/itemValues";
import Account from "./interfaces/Account";
import RoProProfile from "./interfaces/RoProProfile";

let webhookValid: boolean;
let errorWebhookValid: boolean;

export async function checkWebhooks() {
    const configCache = await config();
    return new Promise<boolean>(async resolve => {
        let webhooks = [
            {
                type: 'post',
                url: configCache.post_webhook
            },
            {
                type: 'error',
                url: configCache.error_webhook
            }
        ]

        for (const webhook of webhooks) {
            if (
                !webhook.url ||
                webhook.url.indexOf('discord') < -1
            ) {
                print(chalk.redBright(`[!] the provided ${webhook.type} discord webhook url is invalid`));
                continue;
            }

            await superagent('GET', webhook.url)
                .then(() => {
                    print(chalk.green(`[+] provided ${webhook.type} webhook url is valid`));
                    if (webhook.type == 'post')
                        webhookValid = true;
                    else if (webhook.type == 'error')
                        errorWebhookValid = true;
                })
                .catch(() => {
                    print(chalk.redBright(`[!] provided ${webhook.type} webhook url is invalid`))
                });
        }

        resolve(true);
    })
}

const toTitleCase = str => str.replace(
    /\w\S*/g,
    function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
)

const tagEmoji = ` :label:`;
const itemEmoji = ``;

const tradeTagDB = {
    any: '<:tag_any:931648088379125760>',
    demand: '<:tag_demand:931648088068726874>',
    downgrade: '<:tag_downgrade:931648087590584350>',
    rap: '<:tag_rap:931648088408465438>',
    rares: '<:tag_rares:931648088454615040>',
    robux: '<:tag_robux:931648087817084958>',
    upgrade: '<:tag_upgrade:931648087557046304>',
}

export async function adPosted(account: Account | RoProProfile, adData: AdBody, ropro?: boolean) {
    if (!webhookValid) return;

    const thumbnail = await thumbnails(account.id);
    const url = thumbnail.url || null;

    let offering = [];
    let requesting = [];

    let offeringValue = 0;
    let offeringRAP = 0;
    for (const item of adData.offer_item_ids) {
        const itemInfo = getItem(Number(item));
        if (!itemInfo) continue;

        if (itemInfo.value || itemInfo.rap) offeringValue += itemInfo.value || itemInfo.rap;
        if (itemInfo.rap) offeringRAP += itemInfo.rap;
        offering.push(`[\`${(itemInfo.actual_value || 'unknown').toLocaleString()}\`] ${itemInfo.projected ? ':warning:' : itemEmoji} [${itemInfo.name}](https://rolimons.com/item/${item})`);
    }

    let requestValue = 0;
    let requestRAP = 0;
    for (const item of adData.request_item_ids) {
        const itemInfo = getItem(Number(item));
        if (!itemInfo) continue;

        if (itemInfo.value || itemInfo.rap) requestValue += itemInfo.value || itemInfo.rap;
        if (itemInfo.rap) requestRAP += itemInfo.rap;
        requesting.push(`[\`${(itemInfo.actual_value || 'unknown').toLocaleString()}\`] ${itemInfo.projected ? ':warning:' : itemEmoji} [${itemInfo.name}](https://rolimons.com/item/${item})`);
    }

    for (const tag of adData.request_tags) {
        let tagImageEmoji = tradeTagDB[tag.toLowerCase()] || tagEmoji;
        requesting.push(`${tagImageEmoji} ${toTitleCase(tag)}`);
    }

    const fields = [{
        name: "📤 **Offering**",
        value: offering.join('\n'),
        inline: false
    }, {
        name: "📥 **Requesting**",
        value: requesting.join('\n'),
        inline: false
    }]

    if (requestRAP !== 0)
        fields.push({
            name: "💰 **Gain**",
            value: `📤 \`${offeringValue.toLocaleString()}\` for 📥 \`${requestValue.toLocaleString()}\` - \`${Math.round((requestValue - offeringValue) / offeringValue * 100)}%\` gain`,
            inline: false
        })

    const pageName = ropro ? 'RoPro' : 'Rolimon\'s';
    const embedURL = ropro ? 'https://roblox.com/offers' : `https://www.rolimons.com/playertrades/${account.id}`;

    const webhookBody = {
        content: null,
        embeds: [
            {
                title: `:grin: ${pageName} trade ad posted`,
                url: embedURL,
                color: (await config()).webhook_color,
                fields,
                timestamp: new Date().toISOString(),
                thumbnail: {
                    url: url
                },
                avatar_url: 'https://media.discordapp.net/attachments/910708201937321994/934619532084015104/DSFjSDFljkSLKJFSDLKJFLSKJ234DFljkSD.png'
            }
        ],
        username: `foobad [${account.username}]`
    };

    superagent('POST', (await config()).post_webhook)
        .set('content-type', 'application/json')
        .send(webhookBody)
        .end();
}

export async function webhookPostError(title, message) {
    if (!errorWebhookValid) return;

    const webhookBody = {
        content: null,
        embeds: [
            {
                "title": `:x: ${title}`,
                "description": `\`\`\`\n${message}\n\`\`\``,
                "color": 16737123
            }
        ],
        username: "foobad [errors]"
    }

    superagent('POST', (await config()).error_webhook)
        .set('content-type', 'application/json')
        .send(webhookBody)
        .end()
}

export async function twoFAneeded(username) {
    if (!errorWebhookValid) return;

    const webhookBody = {
        content: `${(await config()).ping_on_2fa}`,
        embeds: [
            {
                "title": `❗ Roblox is requesting 2fa verification for [${username}]`,
                "description": `Click [here](https://www.roblox.com/my/account#!/security) to visit Roblox's account settings page.`,
                "color": 11403134
            }
        ],
        username: "foobad [2fa]"
    }

    superagent('POST', (await config()).error_webhook)
        .set('content-type', 'application/json')
        .send(webhookBody)
        .end();
}