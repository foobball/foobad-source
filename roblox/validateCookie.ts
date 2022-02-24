import superagent from 'superagent';

export default function (cookie): Promise<{
    cookie?: string,
    valid: boolean, id?: number, username?: string
}> {
    return new Promise<{
        valid: boolean,
        id?: number,
        username?: string
    }>(resolve => {
        superagent
            .get('https://www.roblox.com/my/settings/json')
            .set('content-type', 'application/json')
            .set('cookie', `.ROBLOSECURITY=${cookie}`)
            .then(resp => {
                if (!resp.body) return resolve({valid: false})
                const {
                    Name,
                    UserId
                } = resp.body;

                if (!Name || !UserId) return resolve({ valid: false });
                resolve({
                    valid: true,
                    id: UserId,
                    username: Name
                })
            })
            .catch(() => {
                resolve({valid: false});
            })
    });
}