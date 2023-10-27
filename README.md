# trade-tool

It calculates prices and other values based on a graph and will give you the set
of [pareto optimum](https://en.wikipedia.org/wiki/Pareto_efficiency) results.

[Try it out the live demo](https://lokimidgard.github.io/trading-tool/)

# What can be configured

## Cost

Every edge has a number of costs assigned. 
you can define different types of cost, e.g.:
- you can specify a price, every edge will have a value that is multiplied with
  the price increasing the price by x%.
- you can specify duration every edge has a value that is added to the intimal
  value of 0
- you can specify what kind of routes are taken using a bit field. e.g 1 is
  land, 2 is water, 4 is air. The edges will then be combined using bitwise or

you can define filter for costs e.g
- preservability the number of days the good can be shipped. Ever edge reduces
  this value and a filter will discard every route that reaches 0.


The different combinations are:
- multiply
- addition
- bitwise and
- bitwise or

you can also define how to optimize
- minimum
- maximum
- ignored - this value will not be regarded when choosing the best routs.

You need at least one not ignored cost, otherwise random stuff will happen…


## Good

The stuff you want to trade
They have an start value for each defined cost.

They can modify cost on edges, by transforming the cost for every edge e.g.
- a good may be slower to transport increasing the transport time by 2.
- a good may be sensitive to heat and transporting it trough a desert will
  reduce preservability quicker.

They can also define filter for goods e.g.
- some goods may not be transported over sea, you can specify a filter on the
  good that discards the route as soon it goes over sea.

## Nodes

This are places that will be connected. They have a list of goods they produce.
You can ask which goods are available at which palace under what conditions.

## Edges

An Edge connects to places (Nodes) and has a value for each defined cost.


# Open questions
- How performant is (not very 🙈)

# possible further features

- [ ] Reading A JSON file with the configurations
- [ ] Add an interactive map
- [ ] Implement a better multi criterial algo (probably a Dijikstra variant)

*Not sure if I will ever implement those, but you are free to fork ;)*

