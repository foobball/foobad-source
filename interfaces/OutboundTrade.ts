export default interface OutboundTrade {
    created: string,
    expiration: string,
    id: number,
    isActive: boolean,
    status: string,
    user: {
        id: number,
        name: string,
        displayName: string
    }
}