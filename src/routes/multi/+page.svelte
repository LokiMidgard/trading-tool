<script lang="ts">
	import { Graph, type Cost } from '$lib/model';

	// import { Edge, Graph, type Cost } from '$lib/model';

	import '@picocss/pico';
	import { redirect } from '@sveltejs/kit';
	import { onMount } from 'svelte';

	onMount(() => {
		type Costs = [number, number];
		type Edge = Costs;
		type Node = Record<number, Edge>;

		type Graph = Record<number, Node>;

		type Lable = { id: number; cost: Costs; path: number[] };

		function LexikographicSort(a: Costs, b: Costs) {
			for (let i = 0; i < a.length; i++) {
				if (a[i] < b[i]) {
					return -1;
				} else if (a[i] > b[i]) {
					return 1;
				}
			}
			return 0;
		}

		function IsDominant(a: Costs, b: Costs) {
			let isDominant = false;
			for (let i = 0; i < a.length; i++) {
				if (a[i] < b[i]) {
					isDominant = true;
				} else if (a[i] > b[i]) {
					return false;
				}
			}
			return isDominant;
		}
		class ParetoSet {
			private nodes: Lable[] = [];

			tryAdd(node: Lable) {
				const anyDominatesNode = this.nodes.some((x) => IsDominant(x.cost, node.cost));
				if (anyDominatesNode) {
					// we got somethig better
					return false;
				}
				// remove all nodes that are dominated by the new node
				this.nodes = this.nodes.filter((x) => !IsDominant(node.cost, x.cost));
				this.nodes.push(node);
				return true;
			}
		}
		class PriorityQueue {
			private nodes: Lable[] = [];

			enqueue(node: Lable) {
				this.nodes.push(node);
				this.nodes.sort((a, b) => LexikographicSort(a.cost, b.cost));
			}

			dequeue(): Lable | undefined {
				return this.nodes.shift();
			}

			isEmpty(): boolean {
				return this.nodes.length === 0;
			}
		}

		const g: Graph = {
			1: { 2: [1, 2], 3: [2, 1] },
			2: { 4: [1, 1] },
			3: { 4: [1, 1] },
			4: {}
		};

		const queue = new PriorityQueue();
		const paretoSets: Record<number, ParetoSet> = {};
		for (const key in g) {
			paretoSets[key] = new ParetoSet();
		}

		const start = 1;
		queue.enqueue({ id: start, path: [], cost: [0, 0] });

		while (!queue.isEmpty()) {
			const l = queue.dequeue();
			if (l == undefined) {
				continue;
			}
			for (const otherVertex in g[l.id]) {
				const edgeCost = g[l.id][otherVertex];
				const totalCost = edgeCost.map((v, i) => v + l.cost[i]);
				const newLabel = {
					id: otherVertex as any,
					path: [otherVertex as any, ...l.path],
					cost: totalCost as Costs
				};
				if (paretoSets[otherVertex].tryAdd(newLabel)) {
					queue.enqueue(newLabel);
				}
			}
		}

		_paths =  paretoSets

		// type Graph = Record<string, Record<string, number[]>>;

		// class PriorityQueue<T> {
		// 	private nodes: { node: T; priority: number }[] = [];

		// 	enqueue(node: T, priority: number) {
		// 		this.nodes.push({ node, priority });
		// 		this.nodes.sort((a, b) => a.priority - b.priority);
		// 	}

		// 	dequeue(): T | undefined {
		// 		return this.nodes.shift()?.node;
		// 	}

		// 	isEmpty(): boolean {
		// 		return this.nodes.length === 0;
		// 	}
		// }

		// type CriteriaWeights = number[];

		// function paretoShortestPaths(
		// 	graph: Graph,
		// 	start: string,
		// 	end: string,
		// 	criteriaWeights: CriteriaWeights
		// ): { paths: string[][]; distances: number[] } {
		// 	const numCriteria = criteriaWeights.length;
		// 	const distances: Map<number, Map<string, number>> = new Map();
		// 	const previous: Map<number, Map<string, string | null>> = new Map();

		// 	criteriaWeights.forEach((_, i) => {
		// 		distances.set(i, new Map());
		// 		previous.set(i, new Map());
		// 	});

		// 	criteriaWeights.forEach((weight, i) => {
		// 		distances.get(i)!.set(start, 0);
		// 		previous.get(i)!.set(start, null);

		// 		const queue = new PriorityQueue<string>();
		// 		queue.enqueue(start, 0);

		// 		while (!queue.isEmpty()) {
		// 			const currentNode = queue.dequeue()!;
		// 			const currentDistance = distances.get(i)!.get(currentNode);

		// 			for (const neighbor in graph[currentNode]) {
		// 				const edgeWeights = graph[currentNode][neighbor];
		// 				const edgeWeight = edgeWeights[i];
		// 				const totalDistance = currentDistance! + edgeWeight;

		// 				if (
		// 					!distances.get(i)!.has(neighbor) ||
		// 					totalDistance < distances.get(i)!.get(neighbor)!
		// 				) {
		// 					distances.get(i)!.set(neighbor, totalDistance);
		// 					previous.get(i)!.set(neighbor, currentNode);
		// 					queue.enqueue(neighbor, totalDistance);
		// 				}
		// 			}
		// 		}
		// 	});

		// 	// Collect Pareto paths
		// 	const paretoPaths: string[][] = [];
		// 	const paretoDistances: number[] = [];

		// 	for (const node in distances.get(0)!) {
		// 		let isPareto = true;
		// 		for (let i = 1; i < numCriteria; i++) {
		// 			if (distances.get(i)!.get(node)! < distances.get(0)!.get(node)!) {
		// 				isPareto = false;
		// 				break;
		// 			}
		// 		}

		// 		if (isPareto) {
		// 			paretoDistances.push(distances.get(0)!.get(node)!);
		// 			let currentNode: string | null = node;
		// 			const path: string[] = [];
		// 			while (currentNode !== null) {
		// 				path.unshift(currentNode);
		// 				currentNode = previous.get(0)!.get(currentNode)!;
		// 			}
		// 			paretoPaths.push(path);
		// 		}
		// 	}

		// 	return { paths: paretoPaths, distances: paretoDistances };
		// }

		// // Example usage
		// const graph: Graph = {
		// 	A: { B: [5, 2], C: [2, 4] },
		// 	B: { C: [1, 3], D: [3, 2] },
		// 	C: { D: [2, 3] },
		// 	D: { E: [4, 4] },
		// 	E: {}
		// };

		// const criteriaWeights: CriteriaWeights = [0.6, 0.4]; // Weights for criteria 1 and 2
		// const { paths, distances } = paretoShortestPaths(graph, 'A', 'E', criteriaWeights);
		// console.log('Pareto paths:', paths); // Output: [['A', 'C', 'D', 'E']]
		// console.log('Pareto distances:', distances); // Output: [12.4]

		// type Node = number;
		// type Cost = number[];
		// type Edge = [Node, Cost];

		// class PriorityQueue {
		// 	data: [number, Node][];

		// 	constructor() {
		// 		this.data = [];
		// 	}

		// 	enqueue(priority: number, node: Node) {
		// 		this.data.push([priority, node]);
		// 		this.data.sort((a, b) => a[0] - b[0]);
		// 	}

		// 	dequeue() {
		// 		return this.data.shift()?.[1];
		// 	}

		// 	isEmpty() {
		// 		return this.data.length === 0;
		// 	}
		// }

		// function dijkstraPareto(
		// 	graph: Map<Node, Edge[]>,
		// 	start: Node,
		// 	maxCosts: Cost
		// ): Map<Node, Cost> {
		// 	const visited: Map<Node, boolean> = new Map();
		// 	const paretoSet: Map<Node, Cost> = new Map();
		// 	const queue = new PriorityQueue();

		// 	queue.enqueue(0, start);
		// 	paretoSet.set(start, maxCosts);

		// 	while (!queue.isEmpty()) {
		// 		const currentNode = queue.dequeue();
		// 		if(currentNode == undefined){
		// 			continue;
		// 		}
		// 		visited.set(currentNode, true);

		// 		const currentCosts = paretoSet.get(currentNode) as Cost;
		// 		const edges = graph.get(currentNode) ?? [];

		// 		for (const [neighbor, edgeCosts] of edges) {
		// 			const totalCosts = edgeCosts.map((cost, i) => Math.min(currentCosts[i], cost));

		// 			if (!visited.get(neighbor)) {
		// 				const existingCosts = paretoSet.get(neighbor);

		// 				if (!existingCosts || totalCosts.some((cost, i) => cost < existingCosts[i])) {
		// 					paretoSet.set(neighbor, totalCosts);
		// 					queue.enqueue(
		// 						totalCosts.reduce((acc, cost) => acc + cost, 0),
		// 						neighbor
		// 					);
		// 				}
		// 			}
		// 		}
		// 	}

		// 	return paretoSet;
		// }

		// // Example usage:
		// const graph = new Map<Node, Edge[]>();
		// graph.set(0, [
		// 	[1, [1, 2]],
		// 	[2, [2, 1]]
		// ]);
		// graph.set(1, [
		// 	[2, [3, 6]],
		// 	[3, [5, 4]]
		// ]);
		// graph.set(2, [[3, [2, 7]]]);

		// const startNode = 0;
		// const maxCosts = [10, 10]; // Define your maximum costs here

		// const paretoSet = dijkstraPareto(graph, startNode, maxCosts);

		// console.log('Pareto Set:');
		// _paths = {};
		// for (const [node, costs] of paretoSet) {
		// 	console.log(`Node ${node}: [${costs.join(', ')}]`);
		// 	_paths[node] = costs;
		// }

		// _distances = distances;
	});
	let _paths: any = [];
	let _distances: number[] = [];
</script>

<main class="container">
	<article>
		foo
		<pre>
			{JSON.stringify(_paths, undefined, '  ')}
		</pre>
		<pre>
			{JSON.stringify(_distances, undefined, '  ')}
		</pre>
	</article>
</main>
