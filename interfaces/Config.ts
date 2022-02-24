import Account from "./Account";

export default interface Config {
    foobtrade_token: string,

    accounts?: Array<Account>,
    rolimons_cookies: Array<string>,
    roblox_cookies: Array<string>,
    stay_online: boolean,
    alert_on_2fa_needed: boolean,
    ping_on_2fa: string,
    post_ropro_ads: boolean,

    post_delay: number,
    post_delay_variance: number,

    only_request_tags: boolean,
    tag_request_percent: 50,
    use_any_tag_only_when_needed: boolean,
    use_complete_tag_override: boolean
    tag_override: Array<string>,

    item_give_prioritize: Array<number>,
    item_give_blacklist: Array<number>,
    item_give_max_amount: number,
    item_give_min_amount: number,

    post_webhook: string,
    error_webhook: string,
    webhook_color: string | number,
}