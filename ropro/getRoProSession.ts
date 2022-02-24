import superagent from 'superagent';
import getSharedSecret from "./getSharedSecret";
import print from "../print";
import chalk from "chalk";

export default function getRoProSession(cookie: string) {
    return new Promise<string | null>(async resolve => {
        try {
            const roProCookie = await new Promise<string | null>(resolve => {
                superagent('GET', 'https://ropro.io/')
                    .then(resp => {
                        resolve(resp.headers['set-cookie'][0]);
                    })
                    .catch(() => resolve(null));
            })

            const secret = await getSharedSecret(cookie);

            let fakeR1 = {
                readyState: 4,
                responseText: '',
                responseJSON: {
                    UserID: 1693320421,
                    UserName: 'foooobball',
                    RobuxBalance: 9529,
                    ThumbnailUrl: 'https://tr.rbxcdn.com/107d6cfa558339f3701e2e0ce7301c57/352/352/Avatar/Png',
                    IsAnyBuildersClubMember: false,
                    IsPremium: true
                },
                status: 200,
                statusText: 'success'
            }

            let fakeR2 = {
                readyState: 4,
                responseText: '',
                responseJSON: {
                    id: 1693320421,
                    name: 'foooobball',
                    displayName: '食品订单'
                },
                status: 200,
                statusText: 'success'
            };

            let fakeR3 = {
                readyState: 4,
                responseText: '',
                responseJSON: {
                    description: '',
                    created: '2020-06-13T16:03:38.933Z',
                    isBanned: false,
                    externalAppDisplayName: null,
                    id: 1693320421,
                    name: 'foooobball',
                    displayName: ''
                },
                status: 200,
                statusText: 'success'
            }


            const promises = [];

            // r1
            promises.push(new Promise(r1resolve => {
                superagent('GET', 'https://www.roblox.com/mobileapi/userinfo')
                    .set('cookie', `.ROBLOSECURITY=${cookie}`)
                    .then(userinforesp => {
                        fakeR1.responseJSON = userinforesp.body;
                        r1resolve(null);
                    }).catch(() => r1resolve(null))
            }))

            // r2 & r3
            promises.push(new Promise(r2resolve => {
                superagent('GET', 'https://users.roblox.com/v1/users/authenticated')
                    .set('cookie', `.ROBLOSECURITY=${cookie}`)
                    .then(curruserresp => {
                        fakeR2.responseJSON = curruserresp.body;

                        superagent('GET', 'https://users.roblox.com/v1/users/' + curruserresp.body.id)
                            .then(userresp => {
                                fakeR3.responseJSON = userresp.body;

                                fakeR3.responseJSON.displayName = '';
                                fakeR3.responseJSON.description = '';

                                r2resolve(null);
                            }).catch(() => r2resolve(null))
                    }).catch(() => r2resolve(null))
            }))

            await Promise.all(promises);

            fakeR1.responseText = JSON.stringify(fakeR1.responseJSON);
            fakeR2.responseText = JSON.stringify(fakeR2.responseJSON);
            fakeR3.responseText = JSON.stringify(fakeR3.responseJSON);

            const verificationCode =
                `${btoa(unescape(encodeURIComponent(JSON.stringify(fakeR1))))}.${btoa(unescape(encodeURIComponent(JSON.stringify(fakeR2))))}.${btoa(unescape(encodeURIComponent(JSON.stringify(fakeR3))).replace(/[\u0250-\ue007]/g, ''))}`

            const body = {
                verification: verificationCode,
                shared_Secret: secret[0],
                timestamp: secret[1]
            }

            superagent('POST', 'https://ropro.io/api/validateUser.php?free_trial=true')
                .set('cookie', roProCookie)
                .set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
                .send(body)
                .then(resp => {
                    resolve(resp.text == 'err' ? null : roProCookie);
                })
                .catch(() => {
                    print(chalk.redBright('[!] failed to generate ropro code'))
                    resolve(null);
                })
        } catch (e) {
            print(chalk.redBright('[!] failed to generate ropro code'))
            resolve(null);
        }
    })
}