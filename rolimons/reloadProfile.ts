import superagent from 'superagent';
import UserAgent from 'user-agents';

import config from '../config';

export default function (userId) {
    return new Promise<{
        error?: boolean,
        success: boolean,
        playerAssets?: any
    }>(resolve => {
        superagent('get', `https://www.rolimons.com/api/playerassets/${userId}`)
            .set('user-agent', new UserAgent().toString())
            .then(resp => {
                resolve(resp.body);
            })
            .catch(err => {
                resolve({
                    error: true,
                    success: false
                })
            })
    })
}