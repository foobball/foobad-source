import chalk from 'chalk';
import superagent from 'superagent';
import UserAgent from 'user-agents';
import print from '../print';
import RolimonsItem from '../interfaces/RolimonsItem';
import Item from '../interfaces/Item';

let itemCache: Array<RolimonsItem>;

const refreshCache = async () => {
    if (process['halted']) return;

    const data = await new Promise<{
        error: boolean,
        resp?: any,
    }>(resolve => {
        superagent.get('https://www.rolimons.com/itemapi/itemdetails')
            .set('user-agent', new UserAgent().toString())
            .then(resp => {
                resolve({
                    error: false,
                    resp
                })
            })
            .catch(() => {
                resolve({
                    error: true,
                })
            })
    })

    if (data.error)
        return print(chalk.redBright('[!] failed to update price information from rolimons'));
    itemCache = data.resp.body.items;

    return true;
};

export const refreshItemCache = async () => {
    await refreshCache();
    setInterval(refreshCache, 20 * 60 * 1000);
};

export const getEntireItemCache: () => Array<RolimonsItem> = () => itemCache;

const evaluateItem = (itemData: RolimonsItem): Item => {
    let value:number = itemData.rap / 0.78;
    if (itemData.demand > -1) {
        if (itemData.demand < 3) {
            value *= 1 - ((3 - itemData.demand) / 10);
        }
    }

    if (itemData.projected) {
        value *= 1 -
            itemData.rap / (Number(`1${'0'.repeat(itemData.rap.toString().length)}0`));
    }

    value -= 100;

    return {
        name: itemData.name,
        id: itemData.id,
        rap: itemData.rap,
        generated_value: value,
        actual_value: itemData.value < 0 ? itemData.rap : itemData.value,
        projected: itemData.projected,
        demand: itemData.demand,
    };
};

export const getItem = itemid => {
    const item = itemCache[itemid.toString()];
    if (!item) return null;

    const formatted: RolimonsItem = {
        id: Number(itemid),

        name: item[0],
        acronym: item[1],
        rap: item[2],
        value: item[3],
        price: item[4],
        demand: item[6],

        projected: item[7] == 1,
        rare: item[9] == 1,
    };

    return evaluateItem(formatted);
};

