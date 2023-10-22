<script lang="ts">
	import { Edge, Graph, type Cost } from '$lib/model';
	import Mapimage from './mapimage.svelte'

	class Node {
		public readonly name: string;
		public readonly goods: Good[];
		/**
		 *
		 */
		constructor(name: string, ...goods: Good[]) {
			this.name = name;
			this.goods = goods;
		}
	}

	const Properties = [
		'availability',
		'cost',
		'time',
		'preservability',
		'transport over water'
	] as const;

	class Good {
		public readonly startValues: Record<(typeof Properties)[number], number>;
		public readonly name: string;
		public isValid?: (cost: Cost<typeof Properties>) => boolean;

		/**
		 *
		 */
		constructor(
			name: string,
			forbidShip: boolean = false,
			startValues: Partial<Record<(typeof Properties)[number], number>> = {}
		) {
			this.startValues = {
				availability: 1.0,
				cost: 1.0,
				time: 0,
				preservability: Infinity,
				'transport over water': 0,
				...startValues
			};
			this.name = name;
			if (forbidShip) {
				this.isValid = (cost) => (cost['transport over water'] & 1) == 0;
			}
		}
	}

	const knife = new Good('knife');
	const bread = new Good('bread');
	const cake = new Good('Kuchen (Darf nicht länger als 3 Tage transportiert werden)', false, {
		preservability: 3
	});
	const vamp = new Good('Vampiere (nicht per Schiff transportieren)', true);
	const glass = new Good('glass');
	const stone = new Good('stone');

	const a = new Node('A', bread);
	const b = new Node('B', bread, glass, stone);
	const c = new Node('C', bread, glass, knife, cake, vamp);
	const d = new Node('D', bread);

	let allNodes = [a, b, c, d];
	let allGoods = [knife, bread, glass, stone, cake, vamp];

	let from = a;
	let good = bread;

	let data:
		| {
				path: Node[];
				cost: Cost<typeof Properties>;
		  }[]
		| undefined;

	$: data = calculate(from, good);

	function calculate(from: Node, good: Good) {
		const g = new Graph<typeof Properties, Good, Node>({
			availability: {
				merge: 'mul',
				optimize: 'max'
			},
			cost: {
				merge: 'mul',
				optimize: 'min'
			},
			time: {
				merge: 'add',
				optimize: 'min'
			},
			preservability: {
				merge: 'add',
				optimize: 'ignore',
				isValid: (cost) => cost.preservability > 0
			},
			'transport over water': {
				merge: 'bit-or',
				optimize: 'ignore'
			}
		});
		g.nodes.push(a, b, c, d);
		g.addEdge(
			{
				a: a,
				b: b,
				availability: 0.95,
				cost: 1.05,
				time: 3,
				preservability: -3,
				'transport over water': 0
			},
			{
				a: b,
				b: c,
				availability: 0.95,
				cost: 1.05,
				time: 2,
				preservability: -2,
				'transport over water': 0
			},
			{
				a: a,
				b: c,
				availability: 0.95,
				cost: 1.2,
				time: 2,
				preservability: -2,
				'transport over water': 1
			}
		);

		const pathes = g.findGoods(from, good);
		return pathes;
	}
</script>

<label>
	Current position
	<select bind:value={from}>
		{#each allNodes as node}
			<option value={node}>{node.name}</option>
		{/each}
	</select>
</label>
<label>
	Wanted good
	<select bind:value={good}>
		{#each allGoods as node}
			<option value={node}>{node.name}</option>
		{/each}
	</select>
</label>

<table>
	<thead>
		<tr>
			<th>Verfügbarkeit</th>
			<th>Kosten</th>
			<th>Lieferdauer</th>
			<th>Resthaltbarkeit</th>
			<th>Handelsweg</th>
		</tr>
	</thead>
	{#each data ?? [] as d}
		<tr>
			<td>{(d.cost.availability * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td
			>
			<td>{(d.cost.cost * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>
			<td>{d.cost.time} Tage</td>
			<td>{d.cost.preservability} Tage</td>
			<td>{d.path.map((x) => x.name).reverse().join(' > ')}</td>
		</tr>
	{/each}
</table>

<Mapimage/>

<details>
	<summary>JSON</summary>
	<pre>
        {JSON.stringify(data, undefined, '  ')}
    </pre>
</details>
