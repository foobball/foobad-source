import * as discord from './discord';
import config from "./config";
import {refreshItemCache} from "./rolimons/itemValues";

const main = async () => {
    await config();
    await discord.checkWebhooks();
    await refreshItemCache();

    await discord.adPosted({
        id: 1,
        cookie: '',
        username: 'ROBLOX',
        exp: new Date()
    }, {
        offer_item_ids: [
            292969139
        ],
        request_tags: [],
        request_item_ids: [
            292969139
        ],
        player_id: 1
    })
}

main();