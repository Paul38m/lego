'use strict';

/**
 * Description of the available API
 * GET https://lego-api-blue.vercel.app/deals
 * 
 * Search for specific deals
 * 
 * This endpoint accepts the following optional query string parameters:
 * 
 * - `page` - page of deals to return
 * - `size` - number of deals to return
 * 
 * GET https://lego-api-blue.vercel.app/sales
 * 
 * Search for current Vinted sales for a given lego set id
 * 
 * This endpoint accepts the following optional query string parameters:
 * 
 * - `id` - lego set id to return
 */

// Current deals on the page
let currentDeals = [];
let currentPagination = {};
let favoriteDeals = JSON.parse(localStorage.getItem('favoriteDeals')) || [];

// Instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanP5Price = document.querySelector('#p5Price');
const spanP25Price = document.querySelector('#p25Price');
const spanP50Price = document.querySelector('#p50Price');
const spanLifetimeValue = document.querySelector('#lifetimeValue');
const discountFilter = document.querySelector('#discount-filter');
const mostCommentedFilter = document.querySelector('#most-commented-filter');
const hotDealsFilter = document.querySelector('#hot-deals-filter');
const favoriteFilter = document.querySelector('#favorite-filter');
const sortSelect = document.querySelector('#sort-select');
const modal = document.getElementById('deal-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.querySelector('.close');

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
 * Fetch deals from API
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=6] - size of the page (6, 12, or 24)
 * @param  {String}  [sort=''] - sort criteria
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
    console.error('Error fetching deals:', error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Fetch Vinted sales for a given Lego set ID
 * @param {Number} id - Lego set ID
 * @return {Object} - sales data or empty object
 */
const fetchVintedSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );
    const body = await response.json();

    // Log the response to check the structure
    console.log('Vinted Sales Response:', body);

    // Return the sales data or an empty object if no data found
    return body.data || {};
  } catch (error) {
    console.error('Error fetching Vinted sales:', error);
    return {}; // Return an empty object on error
  }
};

/**
 * Fonction pour afficher les informations du deal dans la modale
 * @param {Object} deal - Les informations du deal à afficher
 */
const openDealModal = (deal) => {
  modalBody.innerHTML = `
    <h3>${deal.title}</h3>
    <img src="${deal.photo}" />
    <p><strong>Price:</strong> ${deal.price} €</p>
    <p><strong>Published on:</strong> ${new Date(deal.published * 1000).toLocaleDateString()}</p>
    <p><strong>Temperature:</strong> ${deal.temperature}<strong>°C</strong></p>
    <a href="${deal.link}" target="_blank">Voir plus de détails</a>
  `;
  modal.style.display = 'block';
};

/**
 * Ajout de l'événement pour fermer la modale
 */
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

/**
 * Ajout de l'événement pour fermer la modale si on clique en dehors du contenu
 */
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

/**
 * Ajout de l'événement pour ouvrir la modale lors du clic sur un deal
 */
const addDealClickEvents = () => {
  currentDeals.forEach(deal => {
    const dealElement = document.getElementById(deal.uuid);
    dealElement.addEventListener('click', () => {
      openDealModal(deal);
    });
  });
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
 * Filter deals based on most commented
 * @param {Array} deals
 * @return {Array} filtered deals
 */
const filterDealsByMostCommented = (deals) => {
  return deals.filter(deal => {
    const comments = deal.comments; // Assuming the deal object contains a comments field
    return comments > 15; // Filter deals with more than 15 comments
  });
};

/**
 * Filter deals based on hot deals
 * @param {Array} deals
 * @return {Array} filtered deals
 */
const filterDealsByHotDeals = (deals) => {
  return deals.filter(deal => {
    const temperature = deal.temperature; // Assuming the deal object contains a temperature field
    return temperature > 100; // Filter deals with temperature greater than 100
  });
};

/**
 * Filter deals based on favorite deals
 * @param {Array} deals
 * @return {Array} filtered deals
 */
const filterDealsByFavorites = (deals) => {
  return deals.filter(deal => favoriteDeals.includes(deal.uuid));
};

/**
 * Sort deals based on price or date
 * @param {Array} deals
 * @param {String} criteria - sorting criteria (price-asc, price-desc, date-asc, date-desc)
 * @return {Array} sorted deals
 */
const sortDeals = (deals, criteria) => {
  if (criteria === 'price-asc') {
    return deals.sort((a, b) => a.price - b.price);
  }
  if (criteria === 'price-desc') {
    return deals.sort((a, b) => b.price - a.price);
  }
  if (criteria === 'date-asc') {
    return deals.sort((a, b) => new Date(a.published) - new Date(b.published));
  }
  if (criteria === 'date-desc') {
    return deals.sort((a, b) => new Date(b.published) - new Date(a.published));
  }
  return deals;
};

/**
 * Toggle a deal as favorite in localStorage
 * @param {String} dealId - deal ID to toggle
 */
const toggleFavoriteDeal = (dealId) => {
  if (favoriteDeals.includes(dealId)) {
    favoriteDeals = favoriteDeals.filter(id => id !== dealId);
  } else {
    favoriteDeals.push(dealId);
  }
  localStorage.setItem('favoriteDeals', JSON.stringify(favoriteDeals));
  renderDeals(currentDeals);
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  let filteredDeals = deals;

  if (discountFilter.checked) {
    filteredDeals = filterDealsByDiscount(filteredDeals);
  }
  if (mostCommentedFilter.checked) {
    filteredDeals = filterDealsByMostCommented(filteredDeals);
  }
  if (hotDealsFilter.checked) {
    filteredDeals = filterDealsByHotDeals(filteredDeals);
  }
  if (favoriteFilter.checked) {
    filteredDeals = filterDealsByFavorites(filteredDeals);
  }

  filteredDeals = sortDeals(filteredDeals, sortSelect.value);

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = filteredDeals
    .map(deal => {
      const isFavorite = favoriteDeals.includes(deal.uuid);
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <p>Date: ${new Date(deal.published * 1000).toLocaleDateString()}</p>
        <span>${deal.price}</span>
        <button onclick="toggleFavoriteDeal('${deal.uuid}')">
            ${isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </button>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
  addDealClickEvents();
};

/**
 * Render sales indicators
 * @param {Object} salesData
 */
const renderSalesIndicators = (salesData = {}) => {
  const {
    totalSales = 0,
    averagePrice = 0,
    p5 = 0,
    p25 = 0,
    p50 = 0,
    lifetime = 'N/A'
  } = salesData;

  spanNbSales.textContent = totalSales;
  spanP5Price.textContent = p5;
  spanP25Price.textContent = p25;
  spanP50Price.textContent = p50;
  spanLifetimeValue.textContent = lifetime;
};

/**
 * Render pagination
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
 * @param  {Array} deals
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids
    .map(id => `<option value="${id}">${id}</option>`)
    .join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render deal count indicators
 * @param  {Object} pagination
 */
const renderDealCount = (pagination) => {
  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};

/**
 * General render function
 * @param {Array} deals
 * @param {Object} pagination
 * @param {Object} salesData
 */
const render = (deals, pagination, salesData) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderSalesIndicators(salesData);
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
 * Add event listener for the most commented filter
 */
mostCommentedFilter.addEventListener('change', () => {
  render(currentDeals, currentPagination); // re-render deals when the filter is toggled
});

/**
 * Add event listener for the hot deals filter
 */
hotDealsFilter.addEventListener('change', () => {
  render(currentDeals, currentPagination); // re-render deals when the filter is toggled
});

/**
 * Add event listener for the favorite filter
 */
favoriteFilter.addEventListener('change', () => {
  render(currentDeals, currentPagination); // re-render deals when the filter is toggled
});

sortSelect.addEventListener('change', () => {
  renderDeals(currentDeals);
});

/**
 * Add event listener for Lego set ID selector
 */
selectLegoSetIds.addEventListener('change', async event => {
  const legoSetId = event.target.value; // get the selected Lego set ID
  const salesData = await fetchVintedSales(legoSetId); // fetch Vinted sales data for the selected ID

  // Log the salesData to verify what you get
  console.log('Sales Data:', salesData);

  render(currentDeals, currentPagination, salesData); // render the deals, pagination, and sales data
});

// Initial fetch and render
(async () => {
  const deals = await fetchDeals(); // fetch initial deals
  setCurrentDeals(deals); // set current deals
  render(currentDeals, currentPagination); // render the initial state
})();
