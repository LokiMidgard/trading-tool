<script lang="ts">
	import { Edge, Graph, type Cost } from '$lib/model';
	import Mapimage from './mapimage.svelte';

	import '@picocss/pico';

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
		public get id(): string {
			return this.name;
		}
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

	const goods = [knife,bread,cake, vamp,glass,stone];

	const a = new Node('A', bread);
	const b = new Node('B', bread, glass, stone);
	const c = new Node('C', bread, glass, knife, cake, vamp);
	const d = new Node('D', bread);

	const g = new Graph<string, typeof Properties, Good, Node>(
		{
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
		},
		Object.fromEntries(goods.map((x) => [x.id, x] as const))
	);
	g.addEdge(
		{
			name: 'ab',
			a: a,
			b: b,
			availability: 0.95,
			cost: 1.05,
			time: 3,
			preservability: -3,
			'transport over water': 0
		},
		{
			name: 'bc',
			a: b,
			b: c,
			availability: 0.95,
			cost: 1.05,
			time: 2,
			preservability: -2,
			'transport over water': 0
		},
		{
			name: 'ca',
			a: a,
			b: c,
			availability: 0.95,
			cost: 1.2,
			time: 2,
			preservability: -2,
			'transport over water': 1
		}
	);

	let allNodes = g.nodes;
	let allGoods = [...new Set(g.nodes.flatMap((x) => x.goods))];

	let from = a;
	let good = bread;

	let data:
		| {
				pathNodes: Node[];
				pathEdges: { name: string }[];
				cost: Cost<typeof Properties>;
		  }[]
		| undefined;

	console.time('total');
	for (const city of g.nodes) {
		for (const good of allGoods) {
			const tag = `${city.name}-${good.name}`;
			// console.time(tag);
			g.findGoods(city, good.id);
			// console.timeLog(tag);
		}
	}
	console.timeLog('total');

	$: data = calculate(from, good);

	let ab: string;
	let bc: string;
	let ca: string;

	const colors = ['blue', 'red', 'green', 'purple'];
	$: {
		ab = 'black';
		bc = 'black';
		ca = 'black';
		for (let i = 0; i < (data?.length ?? 0); i++) {
			const color = colors[i];
			const x = (data ?? [])[i];
			ab = x.pathEdges.some((x) => x.name == 'ab') ? color : ab;
			bc = x.pathEdges.some((x) => x.name == 'bc') ? color : bc;
			ca = x.pathEdges.some((x) => x.name == 'ca') ? color : ca;
		}
	}
	function calculate(from: Node, good: Good) {
		const pathes = g.findGoods(from, good.id);
		return pathes;
	}
</script>

<main class="container">
	{#each allNodes as place}
		<article>
			<header>Stadt {place.name}</header>
			Waren:
			<ul>
				{#each place.goods as good}
					<li>
						{good.name}
						<ul>
							<li>
								Haltbarkeit: {good.startValues.preservability} Tage
							</li>
							<li>
								{good.startValues['transport over water']}
								Transportierbar über wasser: {good.isValid == undefined ? 'ja' : 'nein'}
							</li>
						</ul>
					</li>
				{/each}
			</ul>
		</article>
	{/each}

	<article>
		<header>Transport</header>
		<div class="grid">
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
		</div>

		<table>
			<thead>
				<tr>
					<th />
					<th>Verfügbarkeit</th>
					<th>Kosten</th>
					<th>Lieferdauer</th>
					<th>Resthaltbarkeit</th>
					<th>Handelsweg</th>
				</tr>
			</thead>
			{#each data ?? [] as d, i}
				<tr>
					<td><div style="width: 1em; height: 1em; background-color: {colors[i]};" /></td>
					<td
						>{(d.cost.availability * 100).toLocaleString(undefined, {
							maximumFractionDigits: 2
						})}%</td
					>
					<td>{(d.cost.cost * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>
					<td>{d.cost.time} Tage</td>
					<td>{d.cost.preservability} Tage</td>
					<td
						>{d.pathNodes
							.map((x) => x.name)
							.reverse()
							.join(' > ')}</td
					>
				</tr>
			{/each}
		</table>

		<div>
			<Mapimage {ab} {bc} {ca} />
		</div>

		<details>
			<summary>JSON</summary>
			<pre>
        {JSON.stringify(data, undefined, '  ')}
    </pre>
		</details>
	</article>
</main>
