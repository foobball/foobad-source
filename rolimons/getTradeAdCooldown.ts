import superagent from 'superagent';
import UserAgent from 'user-agents';

export default function (cookie): Promise<number> {
    return new Promise<number>(resolve => {
        superagent('GET', 'https://www.rolimons.com/tradeadcreate')
            .set('cookie', `_RoliVerification=${cookie}`)
            .set('user-agent', new UserAgent().toString())
            .then(resp => {
                try {
                    const seconds =
                        Number(resp.text.split('var seconds_until_next_trade_ad = ')[1].split(';')[0]);
                    resolve(isNaN(seconds) ? 5 : seconds / 60);
                } catch (e) {
                    console.error(e);
                    resolve(5)
                }
            })
            .catch(err => {
                console.log(err);
                resolve(5)
            })
    })
}