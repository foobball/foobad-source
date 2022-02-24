import superagent from 'superagent';

export default function getSubscription(roproCookie: string) {
    return new Promise<string>(resolve => {
        superagent('POST', 'https://ropro.io/api/getSubscription.php?key=undefined')
        .set('cookie', roproCookie)
        .then(resp => {
            resolve(resp.text == 'err' ? null : resp.text)
        })
        .catch(() => resolve(null))
    })
}