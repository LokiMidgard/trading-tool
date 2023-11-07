


export class Dijkstra<Cost extends number[]>{
    private readonly edges: { v: [number, number], cost: Cost }[];
    constructor(...edges: { v: [number, number], cost: Cost }[]) {
        this.edges = edges;
    }

    public Calculate(start: number, target: number[]) {
        const Lu: Record<number, { path: number[] }[] | undefined> = {};

        

        return Lu;
    }

}
