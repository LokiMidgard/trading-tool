<script lang="ts">
	import { Graph, type Cost, Edge } from '$lib/model';

	// import { Edge, Graph, type Cost } from '$lib/model';

	import '@picocss/pico';
	import { redirect } from '@sveltejs/kit';
	import { onMount } from 'svelte';

	class Node {
		public readonly name: string;
		public readonly position: readonly [number, number];
		public readonly goods: Good[];
		/**
		 *
		 */
		constructor(name: string, position: readonly [number, number], ...goods: Good[]) {
			this.name = name;
			this.goods = goods;
			this.position = position;
		}
	}

	const Properties = ['availability', 'cost', 'time', 'preservability'] as const;

	class Good {
		public readonly startValues: Record<(typeof Properties)[number], number>;
		public readonly name: string;

		/**
		 *
		 */
		constructor(
			name: string,
			startValues: Partial<Record<(typeof Properties)[number], number>> = {}
		) {
			this.startValues = {
				availability: 1.0,
				cost: 1.0,
				time: 0,
				preservability: Infinity,
				...startValues
			};
			this.name = name;
		}
	}

	let numberOfCitys = 100;
	let width = 500;
	let height = 800;

	let cityData: { citys: Node[]; streets: [Node, Node][] } = { citys: [], streets: [] };

	const goods = [
		{
			Name: 'Magische Elixier',
			Preis: 10.0,
			Haltbarkeit: 30
		},
		{
			Name: 'Drachenzahn-Amulett',
			Preis: 25.0,
			Haltbarkeit: null
		},
		{
			Name: 'Gnomische Schraubenschlüssel',
			Preis: 5.0,
			Haltbarkeit: 90
		},
		{
			Name: 'Elfenbrot',
			Preis: 2.0,
			Haltbarkeit: 7
		},
		{
			Name: 'Zwergenbier',
			Preis: 3.0,
			Haltbarkeit: 60
		},
		{
			Name: 'Phönixfeder',
			Preis: 50.0,
			Haltbarkeit: null
		},
		{
			Name: 'Einhornstaub',
			Preis: 100.0,
			Haltbarkeit: 365
		},
		{
			Name: 'Koboldtränke',
			Preis: 1.0,
			Haltbarkeit: 14
		},
		{
			Name: 'Trollhaut-Rüstung',
			Preis: 75.0,
			Haltbarkeit: null
		},
		{
			Name: 'Phiole mit Feenlicht',
			Preis: 20.0,
			Haltbarkeit: 180
		},
		{
			Name: 'Silberschwert',
			Preis: 15.0,
			Haltbarkeit: null
		},
		{
			Name: 'Drachenei',
			Preis: 100.0,
			Haltbarkeit: 120
		},
		{
			Name: 'Elixier der Unsichtbarkeit',
			Preis: 30.0,
			Haltbarkeit: 45
		},
		{
			Name: 'Goblinschleuder',
			Preis: 8.0,
			Haltbarkeit: 60
		},
		{
			Name: 'Vampirumhang',
			Preis: 40.0,
			Haltbarkeit: null
		},
		{
			Name: 'Feenstaubtrank',
			Preis: 5.0,
			Haltbarkeit: 30
		},
		{
			Name: 'Zauberstab der Elemente',
			Preis: 60.0,
			Haltbarkeit: null
		},
		{
			Name: 'Kristallkugel der Vorhersage',
			Preis: 75.0,
			Haltbarkeit: null
		},
		{
			Name: 'Greifgefiederpfeil',
			Preis: 3.0,
			Haltbarkeit: 45
		},
		{
			Name: 'Minotaurus-Hornhelm',
			Preis: 50.0,
			Haltbarkeit: null
		},
		{
			Name: 'Sphinxrätselrolle',
			Preis: 10.0,
			Haltbarkeit: 90
		},
		{
			Name: 'Königliche Robe',
			Preis: 70.0,
			Haltbarkeit: null
		},
		{
			Name: 'Giftpilztrank',
			Preis: 7.0,
			Haltbarkeit: 30
		},
		{
			Name: 'Einhornhufschuhe',
			Preis: 25.0,
			Haltbarkeit: 60
		},
		{
			Name: 'Werwolfpelzumhang',
			Preis: 45.0,
			Haltbarkeit: null
		},
		{
			Name: 'Orkkeule',
			Preis: 12.0,
			Haltbarkeit: 45
		},
		{
			Name: 'Nebelzaubertrank',
			Preis: 8.0,
			Haltbarkeit: 30
		},
		{
			Name: 'Koboldohrringe',
			Preis: 4.0,
			Haltbarkeit: 180
		},
		{
			Name: 'Diamantbesetzter Dolch',
			Preis: 150.0,
			Haltbarkeit: null
		},
		{
			Name: 'Phönixflügelfächer',
			Preis: 35.0,
			Haltbarkeit: null
		}
	].map((x) => new Good(x.Name, { cost: x.Preis, preservability: x.Haltbarkeit ?? Infinity }));

	$: generate(numberOfCitys);

	let styleSheetCity: CSSStyleSheet;
	let styleSheetEdges: CSSStyleSheet;

	onMount(() => {
		styleSheetCity = newSheet();
		styleSheetEdges = newSheet();
		generate(numberOfCitys);

		function newSheet() {
			const styleEl = document.createElement('style');
			document.head.appendChild(styleEl);
			return styleEl.sheet!;
		}
	});

	function generate(numberOfCitys: number) {
		if (!styleSheetCity) {
			return;
		}

		const citys = [] as Node[];
		const streets = [] as [Node, Node][];

		for (let i = 0; i < numberOfCitys; i++) {
			const numberOfGoods = Math.floor(Math.random() * 3) + 3;

			let position: [number, number] | undefined;
			for (let i = 0; i < 100; i++) {
				position = [Math.random() * width, Math.random() * height];
				if (citys.every((x) => distanceSquere(position!, x.position) > 40 * 40)) {
					break;
				}
				position = undefined;
			}
			if (position == undefined) {
				continue;
			}
			const city = new Node(
				i.toString(),
				position,
				...[...goods]
					.sort((a, b) => (Math.random() > 0.5 ? 1 : -1))
					.filter((_, i) => i < numberOfGoods)
			);
			citys.push(city);
		}

		for (const city of citys) {
			const orderd = citys.sort((a, b) => {
				const lengthSquareA = distanceSquere(a.position, city.position);
				const lengthSquareB = distanceSquere(b.position, city.position);
				return lengthSquareA - lengthSquareB;
			});

			const fromIndex = (Math.random() > 0.999 ? 1 : 0) + (Math.random() > 0.999 ? 1 : 0);
			const to = Math.ceil(Math.random() * 3 + 1) + fromIndex;
			// console.log(to-from)
			if (to - fromIndex <= 0) {
				console.error('was 0');
			}
			let i = 0;
			let found = false;
			for (const other of orderd) {
				const smaler = city.name < other.name ? city : other;
				const bigger = city.name < other.name ? other : city;

				if (!streets.some(([a, b]) => smaler == a && bigger == b)) {
					if (i >= to) {
						found = true;
						break;
					}
					if (i >= fromIndex) {
						streets.push([smaler, bigger]);
					}
					i++;
				}
			}
			if (!found) {
				console.error(`did not find enogh streets`);
			}
		}
		cityData = { citys, streets };

		const gg = new Graph<typeof Properties, Good, Node>({
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
			}
		});

		gg.addEdge(
			...cityData.streets.map((x) => {
				const modifier = Math.random() * 0.05 + Math.random() * -0.05;
				const time = Math.floor(Math.random() * 5) + 1;
				return {
					a: x[0],
					b: x[1],
					name: `${x[0].name} <=> ${x[1].name}`,
					availability: 0.94 * (1 + modifier),
					cost: 1.05 * (1 - modifier),
					time: time,
					preservability: -time
				};
			})
		);

		while (styleSheetCity.cssRules.length < numberOfCitys * 2) {
			const currentRueleIndex = styleSheetCity.cssRules.length / 2;
			styleSheetCity.insertRule(`.city-${currentRueleIndex}.on-hover { display: none;}`);
			styleSheetCity.insertRule(
				`.city-${currentRueleIndex}:hover ~ .city-${currentRueleIndex}.on-hover { display: unset;}`
			);
		}
		while (styleSheetEdges.cssRules.length < gg.edges.length * 2) {
			const currentRueleIndex = styleSheetEdges.cssRules.length / 2;
			styleSheetEdges.insertRule(`.edge-${currentRueleIndex}.on-hover { display: none;}`);
			styleSheetEdges.insertRule(
				`.edge-${currentRueleIndex}:hover ~ .edge-${currentRueleIndex}.on-hover { display: unset;}`
			);
		}

		g = gg;
		function distanceSquere(a: readonly [number, number], b: readonly [number, number]) {
			const vectorA = [a[0] - b[0], a[1] - b[1]];
			const lengthSquareA = Math.pow(vectorA[0], 2) + Math.pow(vectorA[1], 2);
			return lengthSquareA;
		}
	}
	let g: Graph<typeof Properties, Good, Node> | undefined;

	// let allNodes = g.nodes;
	// let allGoods = [...new Set(g.nodes.flatMap((x) => x.goods))];

	let from: Node | undefined;
	let good = goods[0];

	let data:
		| {
				node: Node;
				pathEdges: Edge<typeof Properties, Good, Node>[];
				pathNodes: Node[];
				cost: Cost<typeof Properties>;
		  }[]
		| undefined;

	$: data = g && from ? g.findGoods2(from, good) : undefined;

	function getRandomColor() {
		const h = Math.floor(Math.random() * 360); // Zufälliger Farbwinkel (0-360)
		const s = 50 + Math.random() * 50; // Zufällige Sättigung (50-100)
		const l = 50 + Math.random() * 10; // Zufällige Helligkeit (50-60)

		const color = `hsl(${h}, ${s}%, ${l}%)`;
		return color;
	}
	const color = [] as string[];

	function getColor(i?: number) {
		if (i == undefined) {
			return undefined;
		}
		while (color.length <= i) {
			color.push(getRandomColor());
		}
		return color[i];
	}
</script>

<main class="container">
	<article>
		<header>Transport</header>
		<label>
			Anzahl Städte
			<input type="number" bind:value={numberOfCitys} />
		</label>
		<div class="grid">
			<label>
				Current position
				<select bind:value={from}>
					{#each g?.nodes ?? [] as node}
						<option value={node}>{node.name}</option>
					{/each}
				</select>
			</label>
			<label>
				Wanted good
				<select bind:value={good}>
					{#each goods as node}
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
					<td><div style="width: 1em; height: 1em; background-color: {getColor(i)};" /></td>
					<td
						>{(d.cost.availability * 100).toLocaleString(undefined, {
							maximumFractionDigits: 2
						})}%</td
					>
					<td
						>{(d.cost.cost * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} Silber</td
					>
					<td>{d.cost.time} Tage</td>
					<td>{d.cost.preservability} Tage</td>
					<td
						>{d.pathNodes
							.map((x) => x.name)
							.reverse()
							.concat(from?.name??'')
							.join(' > ')}</td
					>
				</tr>
			{/each}
		</table>
	</article>
	<article>
		<svg viewBox="-10 -10 {width + 50} {height + 50}">
			{#each g?.edges ?? [] as e, i}
				{@const [c1, c2] = e.nodes}
				{@const className = `edge-${i}`}

				<line
					class="{className} edge"
					x1={c1.position[0]}
					y1={c1.position[1]}
					x2={c2.position[0]}
					y2={c2.position[1]}
					stroke={getColor(
						data?.map((x, i) => ({ i, check: x.pathEdges.includes(e) })).filter((x) => x.check)[0]
							?.i
					) ?? 'var(--color)'}
					stroke-width="1"
				/>
			{/each}

			{#each cityData.citys as c, i}
				{@const className = `city-${i}`}
				<circle
					class={className}
					cx={c.position[0]}
					cy={c.position[1]}
					r="5"
					stroke={c == from ? 'var(--primary)' : 'var(--color)'}
					stroke-width="3"
					fill="red"
				/>
				<!-- {c.name} -->
			{/each}
			{#each cityData.citys as c, i}
				{@const className = `city-${i}`}
				<g class="{className} on-hover">
					<text
						x={c.position[0]}
						y={c.position[1]}
						text-anchor="end"
						stroke="var(--primary)"
						stroke-width="2px"
						dy="1em">{c.name}</text
					>
					{#each c.goods as g, i}
						<text
							x={c.position[0]}
							y={c.position[1] + i * 10}
							text-anchor="start"
							font-size="9"
							dy="1em"
							dx="1.0em">{g.name}</text
						>
					{/each}
				</g>
			{/each}

			{#each g?.edges ?? [] as e, i}
				{@const [c1, c2] = e.nodes}
				{@const className = `edge-${i}`}

				<g class="{className} on-hover">
					<text
						font-size="11"
						fill="var(--primary)"
						x={c2.position[0] + (c1.position[0] - c2.position[0]) / 2}
						y={c2.position[1] + (c1.position[1] - c2.position[1]) / 2}
						text-anchor="end"
						dx="-1em"
						dy="1em">{e.cost.time} Tage</text
					>
					<text
						font-size="11"
						fill="var(--primary)"
						x={c2.position[0] + (c1.position[0] - c2.position[0]) / 2}
						y={c2.position[1] + (c1.position[1] - c2.position[1]) / 2}
						text-anchor="start"
						dx="1em"
						dy="1em"
						>{(e.cost.availability * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%
						Verfügbarkeit</text
					>
					<text
						font-size="11"
						fill="var(--primary)"
						x={c2.position[0] + (c1.position[0] - c2.position[0]) / 2}
						y={c2.position[1] + (c1.position[1] - c2.position[1]) / 2}
						text-anchor="start"
						dx="1em"
						dy="-1em"
						>{(e.cost.cost * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}% Kosten</text
					>
				</g>
			{/each}
		</svg>
	</article>
</main>

<style lang="scss">
	.edge:hover {
		stroke: var(--primary);
	}
	// g {
	// 	text {
	// 		display: none;
	// 	}
	// 	&:hover {
	// 		text {
	// 			display: unset;
	// 		}
	// 	}
	// }
</style>
