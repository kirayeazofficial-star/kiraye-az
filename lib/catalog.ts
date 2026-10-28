import { matchesSearch, rentalSearchIntent } from "./search-query";
import type { Listing } from "./marketplace";
import {
  matchesRentalFilters,
  scopeRentalFilters,
  type RentalFilters,
} from "./rental-details";

export const PAGE_SIZE = 18;

export type CatalogQuery = RentalFilters & {
  category: string;
  city: string;
  period: string;
  query: string;
  min: string;
  max: string;
  sort: string;
  favorites: string[] | null;
};

const toNumber = (value: string) =>
  value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value)
    : null;

// Filters and sorts the site's listings in memory. Only "published" listings are shown.
export function filterListings(items: Listing[], input: CatalogQuery): Listing[] {
  const intent = rentalSearchIntent(input.query);
  const effectiveCategory =
    input.category || (intent.categories.length === 1 ? intent.categories[0] : "");
  const filters = scopeRentalFilters(effectiveCategory, input);
  const city = input.city || intent.city;
  const min = toNumber(input.min);
  const max = toNumber(input.max);
  return items
    .filter(
      (item) =>
        item.status === "published" &&
        (!input.category || item.category === input.category) &&
        (!intent.categories.length || intent.categories.includes(item.category)) &&
        (!city || item.city === city) &&
        (!input.period || item.rental_period === input.period) &&
        (min === null || item.price >= min) &&
        (max === null || item.price <= max) &&
        (!input.favorites || input.favorites.includes(item.id)) &&
        matchesRentalFilters(item, filters) &&
        matchesSearch(
          `${item.title} ${item.city} ${item.district ?? ""} ${item.attributes?.brand || ""} ${item.attributes?.model || ""}`,
          intent.query,
        ),
    )
    .sort((a, b) =>
      input.sort === "low"
        ? a.price - b.price
        : input.sort === "high"
          ? b.price - a.price
          : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
}
