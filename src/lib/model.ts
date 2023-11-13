
type keyable = string | number | symbol;

type Good<TId extends keyable, TCost extends readonly string[]> = {
    id: TId,
    localCosts?: Partial<Cost<TCost>>
};

type GoodConfiguration<TId extends keyable, TCost extends readonly string[]> = Record<TId, {
    startValues?: Partial<Cost<TCost>>
    defaultValues?: Partial<Cost<TCost>>
    isValid?: (cost: Cost<TCost>) => boolean
    costTransform?: (cost: Cost<TCost>) => Cost<TCost>
}>;

type Node<TGood extends Good<TId, TCost>, TId extends keyable, TCost extends readonly string[]> = {
    readonly goods: TGood[]
};


export type Cost<TCost extends readonly string[]> = Record<TCost[number], number>;
type CostConfiguration<TCost extends readonly string[]> = Record<TCost[number], {
    optimize: 'min' | 'max' | 'ignore',
    merge: 'mul' | 'add' | 'bit-and' | 'bit-or',
    isValid?: (cost: Cost<TCost>) => boolean
}>;

export class Edge<TId extends keyable, TCost extends readonly string[], TGood extends Good<TId, TCost>, TNode extends Node<TGood, TId, TCost>> {
    public readonly nodes: readonly [TNode, TNode];
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

export class Graph<TId extends keyable, TCost extends readonly string[], TGood extends Good<TId, TCost>, TNode extends Node<TGood, TId, TCost>> {
    public readonly nodes: TNode[];
    public readonly edges: Edge<TId, TCost, TGood, TNode>[];
    public readonly config: CostConfiguration<TCost>;
    public readonly goodConfig: GoodConfiguration<TId, TCost>;
    constructor(config: CostConfiguration<TCost>, goodConftg: GoodConfiguration<TId, TCost>) {
        this.nodes = [];
        this.edges = [];
        this.config = config;
        this.goodConfig = goodConftg;
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

            for (const tkey in this.config) {
                const key = tkey as keyof Cost<TCost>;
                if (this.config[key].optimize == 'ignore') {
                    // we still want an reproducable sorting

                } else if (this.config[key].optimize == 'min' && this.config[key].merge == 'mul') {
                    if (x[key] <= 1) {
                        throw new Error(`${key} is below 1`, { cause: this.config[key] });
                    }
                } else if (this.config[key].optimize == 'max' && this.config[key].merge == 'mul') {
                    if (x[key] >= 1) {
                        throw new Error(`${key} is over 1`, { cause: this.config[key] });
                    }
                } else if (this.config[key].optimize == 'min' && this.config[key].merge == 'add') {
                    if (x[key] <= 0) {
                        throw new Error(`${key} is under 0`, { cause: this.config[key] });
                    }
                } else if (this.config[key].optimize == 'max' && this.config[key].merge == 'add') {
                    if (x[key] >= 0) {
                        throw new Error(`${key} is over 0`, { cause: this.config[key] });
                    }
                }
            }

            delete cost.a;
            delete cost.b;
            delete cost.name;
            return new Edge<TId, TCost, TGood, TNode>(cost, x.a, x.b, x.name);
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
        console.warn('equel priority')
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


    public findGoods(inNode: TNode, good: TId) {
        const allTargets = new Set<TNode>(this.nodes.filter(x => x.goods.map(x => x.id).includes(good)));

        const edgeMap = new Map<TNode, { edge: Edge<TId, TCost, TGood, TNode>, other: TNode }[]>();

        for (const v of this.nodes) {
            const data = [] as { edge: Edge<TId, TCost, TGood, TNode>, other: TNode }[];
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
            pathEdges: Edge<TId, TCost, TGood, TNode>[];
            pathNodes: TNode[]
        };


        class ParetoSet {
            private nodes: Lable[] = [];
            private readonly g: Graph<TId, TCost, TGood, TNode>;
            constructor(g: Graph<TId, TCost, TGood, TNode>) {
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
                if ([...new Set(node.pathNodes)].length != node.pathNodes.length) {
                    console.error('running in circles', node.pathNodes);

                    const dbgData = {
                        circle: node,
                        other: this.nodes,
                        nodes: this.g.nodes,
                        edges: this.g.edges
                    };
                    console.log("data:", JSON.parse(JSON.stringify(dbgData)))


                    throw new Error('running in circles', { cause: node.pathNodes });
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
            private readonly g: Graph<TId, TCost, TGood, TNode>;
            constructor(g: Graph<TId, TCost, TGood, TNode>) {
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

        const startLable = { node: inNode, pathEdges: [], pathNodes: [inNode], cost: { ...this.neutralCostObject(), ...(this.goodConfig[good]?.startValues ?? {}) } };
        paretoSets.get(inNode)?.tryAdd(startLable);
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
                const currentCost = this.goodConfig[good]?.costTransform?.(edgeCost) ?? edgeCost;
                const totalCost = this.merge(currentCost, l.cost);


                if (this.isFilterViolated(totalCost) || !(this.goodConfig[good].isValid?.(totalCost) ?? true)) {
                    continue;
                }

                const newLabel: Lable = {
                    node: edgeData.other,
                    pathEdges: [edgeData.edge, ...l.pathEdges],
                    pathNodes: [edgeData.other, ...l.pathNodes],
                    cost: totalCost
                };

                try {
                    if (paretoSets.get(edgeData.other)?.tryAdd(newLabel) ?? false) {
                        if (targetParetoSet.isDominant(newLabel)) {
                            // if this is not better than any found route to the good, we can stop here
                            queue.enqueue(newLabel);

                            if (allTargets.has(newLabel.node)) {
                                // if we are at an node with the good we can stop and try to add it to our result

                                const localCost = { ...this.neutralCostObject(), ...this.goodConfig[good].defaultValues, ...(newLabel.node.goods.filter(x => x.id == good)[0].localCosts ?? {}) };
                                const transformedLocalCost = this.goodConfig[good].costTransform?.(localCost) ?? localCost;
                                const finalCost = this.merge(transformedLocalCost, newLabel.cost);

                                if (!(this.isFilterViolated(finalCost) || !(this.goodConfig[good].isValid?.(finalCost) ?? true))) {
                                    targetParetoSet.tryAdd({
                                        ...newLabel,
                                        cost: finalCost
                                    });
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`searching for ${(good as { name?: string }).name} in ${(inNode as { name?: string }).name}}`, { inNode, good });
                    throw error;
                }

            }
        }

        return targetParetoSet.Nodes;
    }

    private neutralCostObject() { return (Object.fromEntries(Object.keys(this.config).map((key) => [key, this.config[key as keyof Cost<TCost>].merge == 'mul' ? 1.0 : 0])) as Cost<TCost>); }





}