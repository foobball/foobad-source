import superagent from 'superagent';
import UserAgent from 'user-agents';
import AdBody from "../interfaces/AdBody";

export default function (token: string, body: AdBody) {
    return new Promise<{
        error?: boolean,
        success?: boolean,
        adbody?: AdBody,
        resp?: any
    }>(resolve => {
        body.request_item_ids = body.request_item_ids.slice(0, 4);
        body.request_tags = body.request_tags.slice(0, 4 - body.request_item_ids.length);
        body.offer_item_ids = body.offer_item_ids.slice(0, 4);

        superagent('POST', 'https://www.rolimons.com/tradeapi/create')
            .set('user-agent', new UserAgent().toString())
            .set('content-type', 'application/json')
            .set('cookie', `_RoliVerification=${token}`)
            .send(body)
            .then(resp => {
                resolve({
                    success: true,
                    adbody: body
                });
            })
            .catch(err => {
                try {
                    let error = `(${err.status || '000'})`;
                    if (err.response.body && err.response.body.message)
                        error = err.response.body.message + ' ' + error;

                    resolve({
                        error: true,
                        resp: error.toLowerCase()
                    })
                } catch {
                    resolve({
                        error: true,
                        resp: 'unknown error (000)'
                    })
                }
            })
    })
}