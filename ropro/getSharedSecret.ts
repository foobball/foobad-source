import superagent from 'superagent';

// async function getSharedSecret() {
export default function getSharedSecret(cookie: string) {
    return new Promise(resolve => {
        try {
            superagent('GET', 'https://privatemessages.roblox.com/v1/messages?pageNumber=999999999&pageSize=1&messageTab=inbox')
                .set('cookie', `.ROBLOSECURITY=${cookie}`)
                .then(inboxresp => {
                    if (!inboxresp.body) return resolve([0, 0]);
                    const inboxcollection = inboxresp.body.collection;

                    if (inboxcollection.length !== 1) {
                        superagent('GET', 'https://privatemessages.roblox.com/v1/messages?pageNumber=999999999&pageSize=1&messageTab=archive')
                            .set('cookie', `.ROBLOSECURITY=${cookie}`)
                            .then(archiveresp => {
                                if (!archiveresp.body) return resolve([0, 0]);
                                const archivecollection = archiveresp.body.collection;

                                if (archivecollection.length !== 1) resolve([0, 0]);
                                else resolve([
                                    archivecollection[0].id,
                                    new Date(archivecollection[0].created).getTime()
                                ]);
                            })
                            .catch(() => {
                                resolve([0, 0]);
                            })
                    } else if (inboxcollection[0].sender.name.toLowerCase() === 'builderman') {
                        resolve([
                            inboxcollection[0].id,
                            new Date(inboxcollection[0].created).getTime()
                        ])
                    } else {
                        superagent('GET', 'https://privatemessages.roblox.com/v1/messages?pageNumber=999999999&pageSize=1&messageTab=archive')
                            .set('cookie', `.ROBLOSECURITY=${cookie}`)
                            .then(archiveresp => {
                                if (!archiveresp.body) return resolve([0, 0]);
                                const archivecollection = archiveresp.body.collection;

                                if (archivecollection.length != 1) resolve([
                                    archivecollection[0].id,
                                    new Date(archivecollection[0].created).getTime()
                                ])
                                else resolve([
                                    archivecollection[0].id,
                                    new Date(archivecollection[0].created).getTime()
                                ])
                            })
                            .catch(() => {
                                resolve([0, 0]);
                            })
                    }
                }).catch(() => {
                resolve([0, 0]);
            })
        } catch {
            resolve([0, 0])
        }
    })
}