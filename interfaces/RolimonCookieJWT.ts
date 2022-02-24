export default interface RolimonCookieJWT {
    version: number,
    player_data: {
        name: string,
        id: number
    },
    iat: number,
    exp: number
}