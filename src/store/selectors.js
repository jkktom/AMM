import { createSelector } from 'reselect'

const tokens = state => state.tokens.contracts
const swaps = state => state.amm.swaps

export const chartSelector = createSelector(swaps, tokens, (swaps, tokens) => {
  if (!tokens[0] || !tokens[1]) { return }

  // Filter swaps by selected tokens
  swaps = swaps.filter((s) => s.args.tokenDispense === tokens[0].address || s.args.tokenDispense === tokens[1].address)
  swaps = swaps.filter((s) => s.args.tokenSubmit === tokens[0].address || s.args.tokenSubmit === tokens[1].address)

  // Sort swaps by date ascending to compare history
  swaps = swaps.sort((a, b) => a.args.timestamp - b.args.timestamp)

  // Decorate swaps - add display attributes
  swaps = swaps.map((s) => decorateSwap(s))

  // Fetch prices
  const prices = swaps.map(s => s.rate)

  swaps = swaps.sort((a, b) => b.args.timestamp - a.args.timestamp)

  return({
    swaps: swaps,
    series: [{
      name: "Rate",
      data: prices
    }]
  })
})

const decorateSwap = (swap) => {
  // Calculate token price to 5 decimal places
  const precision = 100000

  let rate = (swap.args.tokenBBalance / swap.args.tokenABalance)

  rate = Math.round(rate * precision) / precision

  return({
    ...swap,
    rate
  })
}
