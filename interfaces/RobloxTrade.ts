export default interface RobloxTrade {
    created: string,
    expiration: string,
    id: number,
    isActive: boolean,
    offers: Array<{
        user: {
            id: number,
            name: string,
            displayName: string
        },
        userAssets: Array<{
            assetId: number,
            assetStock: number,
            id: number,
            membershipType: string,
            name: string,
            originalPrice: number,
            recentAveragePrice: number,
            serialNumber: number
        }>
    }>,
    status: string,
    user: {
        id: number,
        name: string,
        displayName: string
    }
}