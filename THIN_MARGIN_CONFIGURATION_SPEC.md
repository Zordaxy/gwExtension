# Thin-Margin Configuration Specification

## Calculation rules

For a discovered minimum market price (`minPrice`) and the existing production
cost (`cost = Storage.getCost(itemId)`), actual profit remains:

```text
profit = minPrice - cost
```

The required-profit amount is selected from these fixed price bands:

| Minimum market price | Setting | Default required profit |
| --- | --- | ---: |
| `minPrice < 60,000` | `requiredProfit.below60000` | 5,000 |
| `60,000 <= minPrice < 100,000` | `requiredProfit.from60000To99999` | 10,000 |
| `100,000 <= minPrice < 200,000` | `requiredProfit.from100000To199999` | 15,000 |
| `200,000 <= minPrice < 300,000` | `requiredProfit.from200000To299999` | 20,000 |
| `minPrice >= 300,000` | `requiredProfit.from300000` | 30,000 |

The boundaries are fixed and are not user-configurable. When
`halveRequiredProfit` is `true`, the selected configured amount is divided by
two without rounding. The thin-margin decision remains:

```text
isThin = cost > 0 && profit < effectiveRequiredProfit
```

The comparison is strict: profit equal to the effective requirement is not
thin.

## Settings and popup behavior

The five required-profit amounts and `halveRequiredProfit` are stored in the
existing `chrome.storage.local.gwSettings` object. The popup exposes one number
input for each amount and a checkbox labelled **Halve required profit**. The
checkbox defaults to unchecked. Number inputs use `min="0"` and `step="any"`.

Required-profit values are valid only when they are finite numbers greater
than or equal to zero. Blank, non-numeric, negative, and non-finite values are
rejected and must not replace valid persisted values. Validation behavior for
unrelated settings is unchanged.

Reset writes the complete editable defaults, restoring all five required-profit
amounts and setting `halveRequiredProfit` to `false`.

## Backward compatibility and live updates

The new defaults participate in the existing nested default/override merge.
An existing `gwSettings` object that lacks all or some new fields receives the
corresponding defaults without losing its existing overrides.

The content script continues watching storage changes. Thin-margin calculation
reads the current settings at call time, so settings saved while a game page is
open apply to the next `countShop` run. Previously rendered recommendation
cells do not change retroactively.

## Recommendation behavior

When an offer is thin, existing priority and rendering behavior is preserved:

- the displayed reference price is red;
- `data-expected` is `Math.round(cost * 2)`;
- thin handling overrides every other price-adjustment branch.

Minimum market-price discovery, production-cost calculation, and every
non-thin recommendation branch remain unchanged.

## Acceptance criteria

1. Prices at 59,999, 60,000, 99,999, 100,000, 199,999, 200,000, 299,999,
   and 300,000 select the documented fixed bands.
2. Each band uses its configured amount, or its default when absent from saved
   settings.
3. Enabling the checkbox halves the selected amount exactly; fractional halves
   are retained for comparison.
4. A positive-cost item is thin only when actual profit is strictly less than
   the effective requirement; zero/non-positive cost never qualifies.
5. Thin recommendations remain red and recommend rounded double cost, ahead of
   all other adjustment logic.
6. Invalid required-profit input cannot replace a valid saved value; zero and
   finite positive decimal values are accepted.
7. Saving while the game page is open affects the next `countShop` run.
8. Reset and upgrades from settings without the new fields produce the stated
   defaults and an unchecked checkbox.
