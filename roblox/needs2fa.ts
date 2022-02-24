import superagent from 'superagent';

export default function (cookie): Promise<boolean | null> {
    return new Promise<boolean | null>(resolve => {
        superagent('GET', 'https://trades.roblox.com/v1/trade-friction/two-step-verification/status')
        .set('cookie', `.ROBLOSECURITY=${cookie}`)
        .then(resp => {
            resolve(resp.text == 'true');
        }).catch(err => {
            resolve(null);
        });
    })
}