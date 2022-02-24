export default interface Account {
    id: number,
    username: string,
    cookie: string,
    exp: Date,
    rblxcookie?: string,
    ropro?: string
}