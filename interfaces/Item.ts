export default interface Item {
    uaid?: number,
    id: number,

    name: string,
    value?: number,
    actual_value?: number,
    generated_value?: number,
    demand: number,
    projected: boolean,
    rap: number,
}