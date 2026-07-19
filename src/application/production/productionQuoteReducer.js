import {
  changeQuoteQuantity,
  createProductionQuote,
  toggleQuoteExtra,
} from "../../domain/production/productionQuote.js";

export const quoteAction = Object.freeze({
  setQuantity: (field, value) => ({ type: "quantity/set", field, value }),
  setOption: (field, value) => ({ type: "option/set", field, value }),
  toggleExtra: (extra) => ({ type: "extra/toggle", extra }),
  reset: (productionType) => ({ type: "quote/reset", productionType }),
});

export function productionQuoteReducer(state, action) {
  switch (action.type) {
    case "quantity/set":
      return changeQuoteQuantity(state, action.field, action.value);
    case "option/set":
      return { ...state, [action.field]: action.value };
    case "extra/toggle":
      return toggleQuoteExtra(state, action.extra);
    case "quote/reset":
      return createProductionQuote(action.productionType);
    default:
      return state;
  }
}
