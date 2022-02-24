import superagent from 'superagent';

export default function (userId): Promise<{
    error: boolean,
    url?: string
}> {
    return new Promise(resolve => {
        superagent(
            'GET',
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
        ).then(resp => {
            try {
                resolve({
                    error: false,
                    url: resp.body.data[0].imageUrl
                })
            } catch {
                resolve({
                    error: true
                })
            }
        }).catch(() => {
            resolve({
                error: true
            })
        })
    })
}