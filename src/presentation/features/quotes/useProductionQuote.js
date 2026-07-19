import { useMemo, useReducer } from "react";
import { productionQuoteReducer, quoteAction } from "../../../application/production/productionQuoteReducer.js";
import {
  createProductionQuote,
  getMinimumProductionHours,
  hasProductionAssistant,
} from "../../../domain/production/productionQuote.js";
import { getProductionType } from "../../../domain/production/productionTypes.js";

export function useProductionQuote(type) {
  const [quote, dispatch] = useReducer(
    productionQuoteReducer,
    type,
    createProductionQuote,
  );
  const production = useMemo(() => getProductionType(quote.type), [quote.type]);

  return {
    quote,
    production,
    minimumHours: getMinimumProductionHours(quote),
    hasAssistant: hasProductionAssistant(quote),
    setQuantity: (field, value) => dispatch(quoteAction.setQuantity(field, value)),
    setOption: (field, value) => dispatch(quoteAction.setOption(field, value)),
    toggleExtra: (extra) => dispatch(quoteAction.toggleExtra(extra)),
  };
}
