'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const discountFilter = document.querySelector('#discount-filter');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=6] - size of the page (6, 12, or 24)
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Filter deals based on discount
 * @param {Array} deals
 * @return {Array} filtered deals
 */
const filterDealsByDiscount = (deals) => {
  return deals.filter(deal => {
    const discount = deal.discount; // Assuming the deal object contains a discount field
    return discount > 50; // Filter deals with discount greater than 50%
  });
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const filteredDeals = discountFilter.checked ? filterDealsByDiscount(deals) : deals; // Apply filter if checkbox is checked

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = filteredDeals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { length: pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids
    .map(id => `<option value="${id}">${id}</option>`)
    .join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async event => {
  const size = parseInt(event.target.value); // get the selected size (6, 12, or 24)
  const deals = await fetchDeals(currentPagination.currentPage, size); // fetch deals with the selected size

  setCurrentDeals(deals); // update current deals
  render(currentDeals, currentPagination); // re-render deals and pagination
});

/**
 * Select the page to display
 */
selectPage.addEventListener('change', async event => {
  const selectedPage = parseInt(event.target.value); // get the selected page
  const deals = await fetchDeals(selectedPage, parseInt(selectShow.value)); // fetch deals for selected page and size

  setCurrentDeals(deals); // update current deals
  render(currentDeals, currentPagination); // re-render deals and pagination
});

/**
 * Add event listener for the discount filter
 */
discountFilter.addEventListener('change', () => {
  render(currentDeals, currentPagination); // re-render deals when the filter is toggled
});

/**
 * DOMContentLoaded event to fetch the initial deals and render them
 */
document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals(); // fetch the first page of deals with default size 6

  setCurrentDeals(deals); // update current deals
  render(currentDeals, currentPagination); // render deals and pagination
});
