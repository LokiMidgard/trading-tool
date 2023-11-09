<script lang="ts">
	import { cityNames } from '$lib/citynames';
	import { Good, Properties } from '$lib/goods';
	import { Graph, type Cost, Edge } from '$lib/model';
	import { test } from '$lib/testData1';

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

	let numberOfCitys = 100;
	let width = 500;
	let height = 800;

	let cityData: { citys: Node[]; streets: (readonly [Node, Node])[] } = { citys: [], streets: [] };

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
	let goods: Good[] | undefined;

	function generate(numberOfCitys: number) {
		if (!styleSheetCity) {
			return;
		}
		const testdata = test;
		const nonReducedGoods = testdata.nodes.flatMap((x) => x.goods);
		const goodsLookup = nonReducedGoods.reduce((p: Record<string, Good>, c) => {
			if (p[c.name]) {
				return p;
			}
			p[c.name] = new Good(
				c.name,
				Object.fromEntries(Object.entries(c.startValues).filter((x) => x !== null))
			);
			return p;
		}, {} as Record<string, Good>);
		goodsLookup['non'] = new Good('_non');
		goods = Object.values(goodsLookup).sort((a,b)=> a.name.localeCompare(b.name));;
		const nonReducedCitys = testdata.nodes;
		const citysLookup = nonReducedCitys.reduce((p: Record<string, Node>, c) => {
			if (p[c.name]) {
				return p;
			}
			p[c.name] = new Node(c.name, c.position as any, ...c.goods.map((x) => goodsLookup[x.name]));
			return p;
		}, {} as Record<string, Node>);

		const citys = Object.values(citysLookup).sort((a,b)=> a.name.localeCompare(b.name));

		const nonReducedEdges = testdata.edges;
		const edges = Object.values(
			nonReducedEdges.reduce((p: Record<string, Edge<typeof Properties, Good, Node>>, c) => {
				if (p[c.name]) {
					return p;
				}
				p[c.name] = new Edge(
					c.cost,
					citysLookup[c.nodes[0].name],
					citysLookup[c.nodes[1].name],
					c.name
				);
				return p;
			}, {} as Record<string, Edge<typeof Properties, Good, Node>>)
		).sort((a,b)=> a.name.localeCompare(b.name));

		const streets = edges.map((x) => x.nodes);

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

		console.time('total');
		for (const city of g.nodes) {
			for (const good of Object.values(goodsLookup)) {
				const tag = `${city.name}-${good.name}`;
				console.time(tag);
				g.findGoods2(city, good);
				console.timeLog(tag);
			}
		}
		console.timeLog('total');
	}
	let g: Graph<typeof Properties, Good, Node> | undefined;

	// let allNodes = g.nodes;
	// let allGoods = [...new Set(g.nodes.flatMap((x) => x.goods))];

	let from: Node | undefined;
	let good: Good | undefined;

	let data:
		| {
				node: Node;
				pathEdges: Edge<typeof Properties, Good, Node>[];
				pathNodes: Node[];
				cost: Cost<typeof Properties>;
		  }[]
		| undefined;

	$: data = g && from && good ? g.findGoods2(from, good) : undefined;

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
			<input type="number" bind:value={numberOfCitys} max={cityNames.length} min="1" />
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
					{#each goods ?? [] as node}
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
					<td>{d.cost.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })} Silber</td>
					<td>{d.cost.time} Tage</td>
					<td>{d.cost.preservability} Tage</td>
					<td
						>{d.pathNodes
							.map((x) => x.name)
							.reverse()
							.concat(from?.name ?? '')
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
