export class Node {
    public readonly name;
    constructor(name: string) {
        this.name = name;
    }
}


export type Cost<TCost extends string[]> = Record<TCost[number], number>;
type CostConfiguration<TCost extends string[]> = Record<TCost[number], {
    optimize: 'min' | 'max',
    merge: 'mul' | 'add'
}>;

export class Edge<TCost extends string[]> {
    private readonly nodes: Node[];
    public readonly cost: Cost<TCost>;
    constructor(cost: Cost<TCost>, a: Node, b: Node) {
        this.nodes = [a, b];
        this.cost = cost;
    }
    /**
     * isFrom
node:Node     */
    public isFrom(node: Node): Node | undefined {
        if (this.nodes[0] == node) {
            return this.nodes[1];
        }
        else if (this.nodes[1] == node) {
            return this.nodes[0];
        }
        return undefined;
    }
}

export class Graph<TCost extends string[]> {
    public readonly nodes: Node[];
    public readonly edges: Edge<TCost>[];
    public readonly config: CostConfiguration<TCost>;
    constructor(config: CostConfiguration<TCost>) {
        this.nodes = [];
        this.edges = [];
        this.config = config;
    }

    public addEdge(...edges: (Cost<TCost> & { a: Node, b: Node })[]) {
        this.edges.push(...edges.map(x => {
            const cost = { ...x } as (Cost<TCost> & { a?: Node, b?: Node });
            delete cost.a;
            delete cost.b;
            return new Edge<TCost>(cost, x.a, x.b)
        }))
    }

    private merge(element: Cost<TCost>, ...params: Cost<TCost>[]): Cost<TCost> {
        const current = element;
        for (const ele of params) {
            for (const tkey in ele) {
                const key = tkey as keyof Cost<TCost>;
                if (this.config[key].merge == 'mul') {
                    current[key] = (ele[key] * current[key]);
                } else if (this.config[key].merge == 'add') {
                    current[key] = (ele[key] + current[key]);
                }

            }
        }
        return current;
    }

    private isLessAll(element: Cost<TCost>, other: Cost<TCost>): boolean {
        const current = element;
        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'min') {
                if (other[key] < current[key])
                    return false;
            } else {
                if (other[key] > current[key])
                    return false;
            }
        }
        return true;
    }
    private isLessAny(element: Cost<TCost>, other: Cost<TCost>): boolean {
        const current = element;

        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            console.log(this.config)
            console.log(key)
            if (this.config[key].optimize == 'min') {
                if (other[key] > current[key])
                    return true;
            } else {
                if (other[key] < current[key])
                    return true;
            }
        }

        return false;
    }


    /**
     * availability
from:Node, to:Node     */
    public availability(from: Node, to: Node, startValues: Cost<TCost>) {

        const step = (visitedNodes: { node: Node, cost: Cost<TCost> }[]): { node: Node, cost: Cost<TCost> }[][] => {
            const currentNode = visitedNodes[visitedNodes.length - 1];
            if (currentNode.node == to) {
                return [visitedNodes];
            }
            const nextEdges = this.edges.map(x => ({ node: x.isFrom(currentNode.node)!, cost: x.cost })).filter(x => x.node && !visitedNodes.map(x => x.node).includes(x.node));
            const nextPathes = nextEdges.map(x => [...visitedNodes, x!]);

            const foo = nextPathes.flatMap(x => step(x))

            return foo;
        }

        const netralCostObject = () => (Object.fromEntries(Object.keys(this.config).map((key) => [key, this.config[key as keyof Cost<TCost>].merge == 'mul' ? 1.0 : 0])) as Cost<TCost>);
        const allPathes = step([{ node: from, cost: { ...startValues } }])
            .map(pathes => pathes.reduce((p, c) => {
                return { nodes: [...p.nodes, c.node] as Node[], cost: this.merge(c.cost, p.cost) };
            }, { nodes: [] as Node[], cost: netralCostObject() }));

        let besPathes = [] as { nodes: Node[], cost: Cost<TCost> }[];



        // const compareSettings = { availability: 'max', cost: 'min' } as const;
        for (const { nodes, cost } of allPathes) {
            const isBetterThenSome = besPathes.length == 0 || besPathes.filter(x => this.isLessAny(cost, x.cost)).length > 0;
            // obsolete no longer bestPathes
            besPathes = [...besPathes.filter(x => !this.isLessAll(cost, x.cost)), ...(isBetterThenSome ? [{ nodes, cost }] : [])];
        }

        return besPathes;
        ;








    }


}
