import superagent from 'superagent';

export default async function(cookie: string) {
    return new Promise<string | null>(resolve => {
        superagent('POST', 'https://auth.roblox.com/v2/passwords/reset')
            .set('cookie', `.ROBLOSECURITY=${cookie}`)
            .set('content-type', 'application/json')
            .set('origin', 'https://auth.roblox.com')
            .send({})
            .then(resp => resolve(null))
            .catch(err => {
                if (err.response && err.response.status === 403)
                    return resolve(err.response.headers['x-csrf-token'])
                resolve(null);
            })
    });
}
