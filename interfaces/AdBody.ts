export default interface AdBody {
    player_id: number,
    offer_item_ids: Array<number>,
    request_item_ids: Array<number>,
    request_tags: Array<string>
}