<script lang="ts">
	import { Edge, Graph, Node, type Cost } from '$lib/model';
	import { onMount } from 'svelte';

	const a = new Node('A');
	const b = new Node('B');
	const c = new Node('C');
	const d = new Node('D');

	let allNodes = [a, b, c, d];

	let from = a;
	let to = c;

	let data:
		| {
				nodes: Node[];
				cost: Cost<['availability', 'cost', 'time']>;
		  }[]
		| undefined;

	$: data = calculate(from, to);

	function calculate(from: Node, to: Node) {
		const g = new Graph<['availability', 'cost', 'time']>({
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
			}
		});
		g.nodes.push(a, b, c, d);
		g.addEdge(
			{ a: a, b: b, availability: 0.95, cost: 1.05, time: 3 },
			{ a: b, b: c, availability: 0.95, cost: 1.05, time: 2 },
			{ a: a, b: c, availability: 0.95, cost: 1.2, time: 2 }
		);

		const pathes = g.availability(from, to, { availability: 1, cost: 1, time: 0 });
		return pathes;
	}
</script>

<label>
	From
	<select bind:value={from}>
		{#each allNodes as node}
			<option value={node}>{node.name}</option>
		{/each}
	</select>
</label>
<label>
	To
	<select bind:value={to}>
		{#each allNodes as node}
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
			<th>Handelsweg</th>
		</tr>
	</thead>
	{#each data ?? [] as d}
		<tr>
			<td>{(d.cost.availability * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td
			>
			<td>{(d.cost.cost * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>
			<td>{d.cost.time} Tage</td>
			<td>{d.nodes.map((x) => x.name).join(' > ')}</td>
		</tr>
	{/each}
</table>

<details>
	<summary>JSON</summary>
	<pre>
        {JSON.stringify(data, undefined, '  ')}
    </pre>
</details>
