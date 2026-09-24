# Theme map: Dwell 4.2.0 (Lumenook - Dev)

Theme `Lumenook - Dev` #163485778157 on wgx84v-st.myshopify.com, pulled 24 Sep 2026.
Horizon architecture: sections hold theme blocks; files starting with `_` are private blocks, which only their parent can use.
Blocks reach the product through `closest.product` (confirmed in `buy-buttons.liquid`, `add-to-cart.liquid`, `accelerated-checkout.liquid`).

## Page shell

| Area | File |
|---|---|
| Layout | `layout/theme.liquid`: sets `dir` from `request.locale.direction` (RTL ready), renders `{% sections 'header-group' %}`, `{% sections 'footer-group' %}`, then the cart drawer, theme drawer, search modal and quick-add modal |
| CSS include | `snippets/stylesheets.liquid` (loads `base.css`). Add `lumenook.css` in `theme.liquid` right after this snippet renders (line 21) |
| JS include | `snippets/scripts.liquid`: an import map of `@theme/*` modules. Add `lumenook.js` with `defer` in `theme.liquid` |
| Fonts | `snippets/fonts.liquid`. Put the Arabic font loading next to it, only when `request.locale.iso_code == 'ar'` |
| Theme settings | `config/settings_schema.json`, `config/settings_data.json` (colour schemes, type, `cart_type: drawer`) |

## Header and announcement bar

| Part | Files |
|---|---|
| Group | `sections/header-group.json`: contains `header-announcements` and `header` |
| Announcement bar | `sections/header-announcements.liquid` + `blocks/_announcement.liquid`, JS `assets/announcement-bar.js` |
| Header | `sections/header.liquid` (1,819 lines). Its static blocks are `_header-logo` and `_header-menu`. Relevant settings: `enable_sticky_header`, `enable_transparent_header_home` / `_product` / `_collection`, `text_color_transparent_home`. JS: `assets/header.js` |
| Header icons (search, account, bag) | `snippets/header-actions.liquid`, `snippets/cart-bubble.liquid`, JS `assets/header-actions.js`, `assets/cart-icon.js` |
| Row layout | `snippets/header-row.liquid` |
| Language / country | `snippets/localization-form.liquid` |

## Mega menu

| Part | Files |
|---|---|
| Desktop menu block | `blocks/_header-menu.liquid`: `menu` setting (link list) and a `menu_style` setting (`text` / `featured_products` / `featured_collections`) |
| Mega menu panel | `snippets/mega-menu-list.liquid` (columns + featured content), `snippets/util-mega-menu-img-sizes-attr.liquid`, `snippets/link-featured-image.liquid` |
| Mobile menu | `snippets/header-drawer.liquid`, JS `assets/header-drawer.js` |
| Behaviour | `assets/header-menu.js` |

The brief wants 3 link columns plus 1 image card. The closest built-in option is `menu_style: featured_collections`. Check whether it's enough before building a `lumenook-` override.

## Predictive search

`snippets/search-modal.liquid` → `sections/predictive-search.liquid` + `sections/predictive-search-empty.liquid`, with snippets `predictive-search-*`. JS: `assets/predictive-search.js`.

## Cart drawer

| Part | Files |
|---|---|
| Drawer markup | `snippets/cart-drawer.liquid`, rendered once in `theme.liquid` |
| Re-render target | `sections/cart-drawer-section.liquid` (8 lines, wraps the snippet for the Section Rendering API) |
| Contents | `snippets/cart-products.liquid`, `snippets/cart-summary.liquid`, `snippets/cart-items-component.liquid` |
| JS | `assets/cart-drawer.js`, `component-cart-items.js`, `cart-note.js`, `cart-discount.js` |
| Full cart page | `templates/cart.json` → `sections/main-cart.liquid` (blocks `_cart-products`, `_cart-summary`, `_cart-title`) |

There's no free-delivery progress bar yet. It needs a theme setting plus a `lumenook-` snippet rendered in `cart-summary` / `cart-drawer`.

## Footer

| Part | Files |
|---|---|
| Group | `sections/footer-group.json`: two `footer` sections (menus, email signup, logo, social links) and `footer-utilities` |
| Footer | `sections/footer.liquid`. Accepts `menu`, `email-signup`, `logo`, `social-links`, `payment-icons`, `group`, `jumbo-text`, `@app` blocks |
| Bottom bar | `sections/footer-utilities.liquid` + `blocks/footer-copyright.liquid`, `blocks/footer-policy-list.liquid` |
| Blocks | `blocks/menu.liquid`, `email-signup.liquid`, `social-links.liquid`, `payment-icons.liquid` |

The 4 columns and the Night scheme are probably achievable in `footer-group.json` alone.

## Product page

`templates/product.json` has a single `main` section of type `product-information`, plus `product-recommendations` and a `media-with-content` section.

### Product info (buy box)

| Part | Files |
|---|---|
| Section | `sections/product-information.liquid`. Outputs `{{ closest.product \| structured_data }}` (Product JSON-LD already present). Accepts `@theme` and `@app` blocks. Setting `enable_sticky_add_to_cart` drives the built-in sticky bar (`assets/sticky-add-to-cart.js`) |
| Layout | `snippets/product-information-content.liquid` (media and details split) |
| Details column | `blocks/_product-details.liquid` (static). **Accepts `@theme` blocks**, so `lumenook-*` blocks can be added in the editor. Setting `sticky_details_desktop` makes it sticky |
| Blocks in use | `product-title`, `price`, `variant-picker` (+ `swatches`, `variant-main-picker`), `buy-buttons` → `quantity`, `add-to-cart`, `accelerated-checkout`; `product-description`, `accordion` → `_accordion-row`, `disclosures`, `review`, `product-inventory`, `sku`, `product-custom-property` |
| JS | `assets/product-form.js`, `variant-picker.js`, `product-price.js`, `product-inventory.js` |

### Product media

| Part | Files |
|---|---|
| Gallery block | `blocks/_product-media-gallery.liquid` (static). Settings `media_presentation` (carousel / grid), `media_columns`, `large_first_image`, `image_gap` |
| Rendering | `snippets/product-media-gallery-content.liquid`, `snippets/product-media.liquid`, `snippets/media.liquid`, `snippets/util-product-media-sizes-attr.liquid` |
| JS | `assets/media-gallery.js`, `media.js`, `slideshow.js` (mobile carousel) |

### Related sections

`sections/product-recommendations.liquid` (JS `product-recommendations.js`). A recently-viewed script already exists: `assets/recently-viewed-products.js`.

## Collection grid

| Part | Files |
|---|---|
| Template | `templates/collection.json`: a `section` (title/description) and `main-collection` |
| Section | `sections/main-collection.liquid`. Settings `enable_infinite_scroll` / `products_per_page` (24 by default), paginates `collection.products` |
| Grid | `snippets/product-grid.liquid` (shared with `search-results.liquid`), `snippets/util-product-grid-card-size.liquid`, `snippets/grid-density-controls.liquid` |
| Card | `blocks/_product-card.liquid` → `snippets/product-card.liquid`; children `_product-card-gallery`, `_product-card-group`, `product-title`, `price`, `swatches`. Badges: `snippets/product-badges-styles.liquid` |
| Filters / sort | `blocks/filters.liquid`, `snippets/list-filter.liquid`, `price-filter.liquid`, `sorting.liquid`, `filter-remove-buttons.liquid`. JS `assets/facets.js` |
| Pagination | `snippets/pagination-controls.liquid`, `assets/paginated-list.js`. Infinite scroll exists. "Load more" (12 per load) is a customisation |
| Quick add | `snippets/quick-add.liquid`, `quick-add-modal.liquid`, JS `assets/quick-add.js` |

## Homepage

`templates/index.json` currently holds the Dwell demo: `hero`, `product-list`, `collection-list` ×2, `media-with-content`, `product-hotspots`, generic `section` groups.

## Locales

`locales/en.default.json` and `locales/ar.json` both exist (Dwell ships Arabic). The new `lumenook.*` keys go in both.
