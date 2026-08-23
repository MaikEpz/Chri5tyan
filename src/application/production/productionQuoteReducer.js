import {
  changeQuoteOption,
  changeQuoteQuantity,
  createProductionQuote,
  setQuoteCastingSelections,
  setQuoteLocationSelection,
  toggleQuoteExtra,
} from "../../domain/production/productionQuote.js";

export const quoteAction = Object.freeze({
  setQuantity: (field, value) => ({ type: "quantity/set", field, value }),
  setOption: (field, value) => ({ type: "option/set", field, value }),
  toggleExtra: (extra) => ({ type: "extra/toggle", extra }),
  setCastingSelections: (selections) => ({ type: "casting-selections/set", selections }),
  setLocationSelection: (selection) => ({ type: "location-selection/set", selection }),
  reset: (productionType) => ({ type: "quote/reset", productionType }),
});

export function productionQuoteReducer(state, action) {
  switch (action.type) {
    case "quantity/set":
      return changeQuoteQuantity(state, action.field, action.value);
    case "option/set":
      return changeQuoteOption(state, action.field, action.value);
    case "extra/toggle":
      return toggleQuoteExtra(state, action.extra);
    case "casting-selections/set":
      return setQuoteCastingSelections(state, action.selections);
    case "location-selection/set":
      return setQuoteLocationSelection(state, action.selection);
    case "quote/reset":
      return createProductionQuote(action.productionType);
    default:
      return state;
  }
}
