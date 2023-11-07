
type Good<TCost extends readonly string[]> = {
    startValues: Cost<TCost>
    isValid?: (cost: Cost<TCost>) => boolean
    costTransform?: (cost: Cost<TCost>) => Cost<TCost>
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
    public readonly nodes: readonly TNode[];
    public readonly cost: Cost<TCost>;
    public readonly name: string;
    constructor(cost: Cost<TCost>, a: TNode, b: TNode, name?: string) {
        this.nodes = [a, b];
        this.cost = cost;
        this.name = name ?? '';
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
    public readonly nodes: TNode[];
    public readonly edges: Edge<TCost, TGood, TNode>[];
    public readonly config: CostConfiguration<TCost>;
    constructor(config: CostConfiguration<TCost>) {
        this.nodes = [];
        this.edges = [];
        this.config = config;
    }

    public addEdge(...edges: (Cost<TCost> & { a: TNode, b: TNode, name?: string })[]) {
        this.edges.push(...edges.map(x => {
            const cost = { ...x } as (Cost<TCost> & { a?: TNode, b?: TNode, name?: string });
            if (!this.nodes.includes(x.a)) {
                this.nodes.push(x.a);
            }
            if (!this.nodes.includes(x.b)) {
                this.nodes.push(x.b);
            }
            delete cost.a;
            delete cost.b;
            delete cost.name;
            return new Edge<TCost, TGood, TNode>(cost, x.a, x.b, x.name);
        }))
    }

    private merge(element: Cost<TCost>, ...params: Cost<TCost>[]): Cost<TCost> {
        const current = { ...element };
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

    private lexicograpicSot(a: Cost<TCost>, b: Cost<TCost>): -1 | 0 | 1 {
        for (const tkey of Object.keys(a)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'ignore') {
                // we still want an reproducable sorting
                if (a[key] < b[key]) {
                    return -1;
                } else if (a[key] > b[key]) {
                    return 1;
                }
            } else if (this.config[key].optimize == 'min') {
                if (a[key] < b[key]) {
                    return -1;
                } else if (a[key] > b[key]) {
                    return 1;
                }
            } else {
                if (a[key] > b[key]) {
                    return -1;
                } else if (a[key] < b[key]) {
                    return 1;
                }
            }
        }
        return 0;
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
        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'ignore') {
                continue;
            } else if (this.config[key].optimize == 'min') {
                if (element[key] < other[key])
                    return true;
            } else {
                if (element[key] > other[key])
                    return true;
            }
        }

        return false;
    }
    private isDominant(element: Cost<TCost>, other: Cost<TCost>): boolean {
        let isDominant = false;
        for (const tkey of Object.keys(other)) {
            const key = tkey as keyof Cost<TCost>;
            if (this.config[key].optimize == 'ignore') {
                continue;
            } else if (this.config[key].optimize == 'min') {
                if (element[key] < other[key]) {
                    isDominant = true;
                } else if (element[key] > other[key]) {
                    return false;
                }
            } else {
                if (element[key] > other[key]) {
                    isDominant = true;
                } else if (element[key] < other[key]) {
                    return false;
                }
            }
        }
        return isDominant;
    }


    public findGoods2(inNode: TNode, good: TGood) {
        const allTargets = new Set<TNode>(this.nodes.filter(x => x.goods.includes(good)));

        const edgeMap = new Map<TNode, { edge: Edge<TCost, TGood, TNode>, other: TNode }[]>();

        for (const v of this.nodes) {
            const data = [] as { edge: Edge<TCost, TGood, TNode>, other: TNode }[];
            edgeMap.set(v, data);
            for (const e of this.edges) {
                const other = e.isFrom(v);
                if (other) {
                    data.push({ edge: e, other: other });
                }
            }
        }

        // type Node = Record<number, Edge>;


        type Lable = {
            node: TNode;
            cost: Cost<TCost>;
            pathEdges: Edge<TCost, TGood, TNode>[];
            pathNodes: TNode[]
        };


        class ParetoSet {
            private nodes: Lable[] = [];
            private readonly g: Graph<TCost, TGood, TNode>;
            constructor(g: Graph<TCost, TGood, TNode>) {
                this.g = g;
            }

            public get Nodes(): Lable[] {
                return [...this.nodes];
            }

            tryAdd(node: Lable) {
                const anyDominatesNode = this.nodes.some((x) => this.g.isDominant(x.cost, node.cost));
                if (anyDominatesNode) {
                    // we got somethig better
                    return false;
                }
                // remove all nodes that are dominated by the new node
                this.nodes = this.nodes.filter((x) => !this.g.isDominant(node.cost, x.cost));
                this.nodes.push(node);
                return true;
            }
            isDominant(node: Lable) {
                const anyDominatesNode = this.nodes.some((x) => this.g.isDominant(x.cost, node.cost));
                if (anyDominatesNode) {
                    // we got somethig better
                    return false;
                }
                return true;
            }
        }
        class PriorityQueue {
            private readonly nodes: Lable[] = [];
            private readonly g: Graph<TCost, TGood, TNode>;
            constructor(g: Graph<TCost, TGood, TNode>) {
                this.g = g;
            }
            enqueue(node: Lable) {
                this.nodes.push(node);
                this.nodes.sort((a, b) => this.g.lexicograpicSot(a.cost, b.cost));
            }

            dequeue(): Lable | undefined {
                return this.nodes.shift();
            }

            isEmpty(): boolean {
                return this.nodes.length === 0;
            }
        }


        const queue = new PriorityQueue(this);
        const paretoSets: Map<TNode, ParetoSet> = new Map<TNode, ParetoSet>();
        for (const key of this.nodes) {
            paretoSets.set(key, new ParetoSet(this));
        }
        const targetParetoSet = new ParetoSet(this);

        const startLable = { node: inNode, pathEdges: [], pathNodes: [], cost: good.startValues };
        if (allTargets.has(inNode)) {
            targetParetoSet.tryAdd(startLable)
        }
        queue.enqueue(startLable);

        while (!queue.isEmpty()) {
            const l = queue.dequeue();
            if (l == undefined) {
                continue;
            }
            for (const edgeData of edgeMap.get(l.node) ?? []) {

                const edgeCost = edgeData.edge.cost;
                const currentCost = good.costTransform?.(edgeCost) ?? edgeCost;
                const totalCost = this.merge(currentCost, l.cost);


                if (this.isFilterViolated(totalCost) || !(good.isValid?.(totalCost) ?? true)) {
                    continue;
                }

                const newLabel: Lable = {
                    node: edgeData.other,
                    pathEdges: [edgeData.edge, ...l.pathEdges],
                    pathNodes: [edgeData.other, ...l.pathNodes],
                    cost: totalCost
                };
                if (paretoSets.get(edgeData.other)?.tryAdd(newLabel) ?? false) {
                    if (targetParetoSet.isDominant(newLabel)) {
                        if (allTargets.has(newLabel.node)) {
                            // if we are at an node with the good we can stop and try to add it to our result
                            targetParetoSet.tryAdd(newLabel);
                        } else if (targetParetoSet.isDominant(newLabel)) {
                            // if this is not better than any found route to the good, we can stop here
                            queue.enqueue(newLabel);
                        }
                    }
                }
            }
        }

        return targetParetoSet.Nodes;
    }
    public findGoods(inNode: TNode, good: TGood) {

        const allTargets = this.nodes.filter(x => x.goods.includes(good));

        let besPathes = [] as { pathNodes: TNode[], pathEdges: Edge<TCost, TGood, TNode>[], cost: Cost<TCost> }[];

        const step = (visitedNodes: { pathNodes: TNode[], cost: Cost<TCost>, pathEdges: Edge<TCost, TGood, TNode>[] }) => {
            const currentNode = visitedNodes.pathNodes[visitedNodes.pathNodes.length - 1];
            if (allTargets.includes(currentNode)) {
                // we know it is pat of the current known pareti opitmum
                // it was cheked befor step was called
                // we still need to add it to best path
                // and remove no longe optimal values

                besPathes = [...besPathes.filter(x => !this.isBetterInAll(visitedNodes.cost, x.cost)), visitedNodes];
                return; // fonud
            }
            const nextEdges = this.edges.map(x => ({ node: x.isFrom(currentNode)!, cost: x.cost, edge: x })).filter(x => x.node && !visitedNodes.pathNodes.includes(x.node));



            for (const { node, cost, edge } of nextEdges) {
                const nexPath = [...visitedNodes.pathNodes, node];
                const nexPathEdges = [...visitedNodes.pathEdges, edge];
                const currentCost = good.costTransform?.({ ...visitedNodes.cost }) ?? visitedNodes.cost;
                const newTotalCost = this.merge(cost, currentCost);

                if (this.isFilterViolated(newTotalCost) || !(good.isValid?.(newTotalCost) ?? true)) {
                    continue;
                }
                // if tihs is worse then the best we found yet, stop
                const isBetterThenSome = besPathes.length == 0 || besPathes.filter(x => this.isBetterInAny(newTotalCost, x.cost)).length > 0;

                if (!isBetterThenSome) {
                    continue;
                }
                step({ pathNodes: nexPath, cost: newTotalCost, pathEdges: nexPathEdges });
            }
        };
        step({ pathNodes: [inNode], cost: good.startValues, pathEdges: [] });
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