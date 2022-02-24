import superagent from 'superagent';
import AdBody from "../interfaces/AdBody";

const idShortcuts = {
    demand: -2,
    rares: -3,
    upgrade: -4,
    downgrade: -5,
    robux: -6,
    rap: -7,
    any: -8,
};

export default async function postRoProTradeAd(cookie: string, adBody: AdBody) {
    return new Promise<{
        error?: boolean,
        success?: boolean,
        adbody?: AdBody,
        resp?: any
    }>(resolve => {
        let requestBody = {
            userid: adBody.player_id,
            want_item: -1,
            want_item2: -1,
            want_item3: -1,
            want_item4: -1,
            want_value: 0,
            item1: -1,
            item2: -1,
            item3: -1,
            item4: -1,
            note: ''
        }

        let wantArray = [];
        let haveArray = adBody.offer_item_ids.splice(0, 4);
        adBody.offer_item_ids = haveArray;

        for (const requestid of adBody.request_item_ids)
            wantArray.push(requestid)
        for (const requesttag of adBody.request_tags) {
            const numForTag = idShortcuts[requesttag];
            if (numForTag)
                wantArray.push(numForTag);
            else console.log(requesttag)
        }
        wantArray = wantArray.splice(0, 4);

        requestBody.want_item = wantArray[0] || -1;
        requestBody.want_item2 = wantArray[1] || -1;
        requestBody.want_item3 = wantArray[2] || -1;
        requestBody.want_item4 = wantArray[3] || -1;

        requestBody.item1 = haveArray[0] || -1;
        requestBody.item2 = haveArray[1] || -1;
        requestBody.item3 = haveArray[2] || -1;
        requestBody.item4 = haveArray[3] || -1;

        superagent('POST', 'https://ropro.io/api/postWishlist.php')
            .set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
            .set('cookie', cookie)
            .send(requestBody)
            .then(resp => {
                if (typeof resp.text == 'string' && resp.text.indexOf('err') > -1) {
                    resolve({
                        error: true,
                        resp: (JSON.parse(resp.text).error || `unknown error (${resp.status || '000'})`).toLowerCase()
                    })
                } else
                    resolve({
                        success: true,
                    })
            })
            .catch(err => {
                resolve({
                    error: true,
                })
            })
    })
}