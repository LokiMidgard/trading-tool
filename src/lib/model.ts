
type Good<TCost extends readonly string[]> = {
    startValues: Cost<TCost>
};

type Node<TGood extends Good<TCost>, TCost extends readonly string[]> = {
    readonly goods: TGood[]
};


export type Cost<TCost extends readonly string[]> = Record<TCost[number], number>;
type CostConfiguration<TCost extends readonly string[]> = Record<TCost[number], {
    optimize: 'min' | 'max' | 'ignore',
    merge: 'mul' | 'add' | 'bit-and' | 'bit-or',
    isValid?: (cost: Cost<TCost>) => boolean
}>;

export class Edge<TCost extends readonly string[], TGood extends Good<TCost>, TNode extends Node<TGood, TCost>> {
    private readonly nodes: TNode[];
    public readonly cost: Cost<TCost>;
    constructor(cost: Cost<TCost>, a: TNode, b: TNode) {
        this.nodes = [a, b];
        this.cost = cost;
    }
    /**
     * isFrom
node:Node     */
    public isFrom(node: TNode): TNode | undefined {
        if (this.nodes[0] == node) {
            return this.nodes[1];
        }
        else if (this.nodes[1] == node) {
            return this.nodes[0];
        }
        return undefined;
    }
}

export class Graph<TCost extends readonly string[], TGood extends Good<TCost>, TNode extends Node<TGood, TCost>> {
    public readonly nodes: Node<TGood, TCost>[];
    public readonly edges: Edge<TCost, TGood, TNode>[];
    public readonly config: CostConfiguration<TCost>;
    constructor(config: CostConfiguration<TCost>) {
        this.nodes = [];
        this.edges = [];
        this.config = config;
    }

    public addEdge(...edges: (Cost<TCost> & { a: TNode, b: TNode })[]) {
        this.edges.push(...edges.map(x => {
            const cost = { ...x } as (Cost<TCost> & { a?: TNode, b?: TNode });
            if (!this.nodes.includes(x.a)) {
                this.nodes.push(x.a);
            }
            if (!this.nodes.includes(x.b)) {
                this.nodes.push(x.b);
            }
            delete cost.a;
            delete cost.b;
            return new Edge<TCost, TGood, TNode>(cost, x.a, x.b)
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
                } else if (this.config[key].merge == 'bit-and') {
                    current[key] = (ele[key] & current[key]);
                } else if (this.config[key].merge == 'bit-or') {
                    current[key] = (ele[key] | current[key]);
                }

            }
        }
        return current;
    }

    private isFilterViolated(cost: Cost<TCost>): boolean {
        for (const tkey of Object.keys(cost)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].isValid?.(cost) ?? true) {
                continue;
            } else {
                return true;
            }
        }
        return false;
    }

    private isBetterInAll(element: Cost<TCost>, other: Cost<TCost>): boolean {
        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'ignore') {
                continue;
            } else if (this.config[key].optimize == 'min') {
                if (element[key] > other[key])
                    return false;
            } else {
                if (element[key] < other[key])
                    return false;
            }
        }
        return true;
    }

    private isBetterInAny(element: Cost<TCost>, other: Cost<TCost>): boolean {
        const current = element;

        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'ignore') {
                continue;
            } else if (this.config[key].optimize == 'min') {
                if (current[key] < other[key])
                    return true;
            } else {
                if (current[key] > other[key])
                    return true;
            }
        }

        return false;
    }


    public findGoods(inNode: TNode, good: TGood) {

        const allTargets = this.nodes.filter(x => x.goods.includes(good));

        let besPathes = [] as { path: TNode[], cost: Cost<TCost> }[];

        const step = (visitedNodes: { path: TNode[], cost: Cost<TCost> }) => {
            const currentNode = visitedNodes.path[visitedNodes.path.length - 1];
            if (allTargets.includes(currentNode)) {
                // we know it is pat of the current known pareti opitmum
                // it was cheked befor step was called
                // we still need to add it to best path
                // and remove no longe optimal values

                besPathes = [...besPathes.filter(x => !this.isBetterInAll(visitedNodes.cost, x.cost)), visitedNodes];
                return; // fonud
            }
            const nextEdges = this.edges.map(x => ({ node: x.isFrom(currentNode)!, cost: x.cost })).filter(x => x.node && !visitedNodes.path.includes(x.node));



            for (const { node, cost } of nextEdges) {
                const nexPath = [...visitedNodes.path, node];
                const newCost = this.merge(cost, visitedNodes.cost);

                if (this.isFilterViolated(newCost)) {
                    continue;
                }
                // if tihs is worse then the best we found yet, stop
                const isBetterThenSome = besPathes.length == 0 || besPathes.filter(x => this.isBetterInAny(newCost, x.cost)).length > 0;

                if (!isBetterThenSome) {
                    continue;
                }
                step({ path: nexPath, cost: newCost });
            }
        };
        step({ path: [inNode], cost: good.startValues });
        return besPathes;
    }

    private neutralCostObject() { return (Object.fromEntries(Object.keys(this.config).map((key) => [key, this.config[key as keyof Cost<TCost>].merge == 'mul' ? 1.0 : 0])) as Cost<TCost>); }

    /**
     * availability
from:Node, to:Node     */
    public availability(from: TNode, to: TNode, startValues: Cost<TCost>) {

        const step = (visitedNodes: { node: TNode, cost: Cost<TCost> }[]): { node: TNode, cost: Cost<TCost> }[][] => {
            const currentNode = visitedNodes[visitedNodes.length - 1];
            if (currentNode.node == to) {
                return [visitedNodes];
            }
            const nextEdges = this.edges.map(x => ({ node: x.isFrom(currentNode.node)!, cost: x.cost })).filter(x => x.node && !visitedNodes.map(x => x.node).includes(x.node));
            const nextPathes = nextEdges.map(x => [...visitedNodes, x!]);

            const foo = nextPathes.flatMap(x => step(x))

            return foo;
        }

        const allPathes = step([{ node: from, cost: { ...startValues } }])
            .map(pathes => pathes.reduce((p, c) => {
                return { nodes: [...p.nodes, c.node] as TNode[], cost: this.merge(c.cost, p.cost) };
            }, { nodes: [] as TNode[], cost: this.neutralCostObject() }));

        let besPathes = [] as { nodes: TNode[], cost: Cost<TCost> }[];



        // const compareSettings = { availability: 'max', cost: 'min' } as const;
        for (const { nodes, cost } of allPathes) {
            const isBetterThenSome = besPathes.length == 0 || besPathes.filter(x => this.isBetterInAny(cost, x.cost)).length > 0;
            // obsolete no longer bestPathes
            besPathes = [...besPathes.filter(x => !this.isBetterInAll(cost, x.cost)), ...(isBetterThenSome ? [{ nodes, cost }] : [])];
        }

        return besPathes;
        ;








    }


}
