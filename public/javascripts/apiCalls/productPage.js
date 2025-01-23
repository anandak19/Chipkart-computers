const priceOrder = document.getElementById("priceOrder");
const sortBy = document.getElementById("sortBy");
const rating = document.getElementById("rating");
const isFeaturedCheckbox = document.getElementById("isFeatured");
const isNewCheckbox = document.getElementById("isNew");
const isPopularCheckbox = document.getElementById("isPopular");
const categoryList = document.getElementById("categoryList");
let categoryId


// to display products with details
const showProducts = (products) => {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  products.forEach((product) => {
    const productCard = `
        <div class="product-card">
          <div class="product-card-image">
            <img src="${product.images[0].filepath}" alt="${product.productName}" />
          </div>
          <div class="product-card-details">
            <h4>
              <a href="#">${product.productName}</a>
            </h4>
            <div class="price">
              <p class="selling-price">${product.finalPrice}</p>
              <p class="actual-price">${product.mrp}</p>
            </div>
          </div>
          <div class="product-actions">
            <button class="add-cart">Add Cart</button>
            <button class="wishlist">Wishlist</button>
          </div>
        </div>
      `;

    productList.insertAdjacentHTML("beforeend", productCard);
  });
};

// on page load method
async function fetchProducts() {
  try {
    const response = await fetch("/products/p");
    const products = await response.json();
    showProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Something went wrong");
  }
}
document.addEventListener("DOMContentLoaded", fetchProducts);

// Function to get selected filters
const getFilters = () => {
  const filters = {};

  if (priceOrder.value) filters.priceOrder = priceOrder.value;
  if (sortBy.value) filters.sortBy = sortBy.value;
  if (rating.value) filters.ratingsAbove = rating.value;
  if (isFeaturedCheckbox.checked) filters.isFeatured = true;
  if (isNewCheckbox.checked) filters.isNew = true;
  if (isPopularCheckbox.checked) filters.isPopular = true;

  if (categoryId) {
    filters.categoryId = categoryId
  }

  return filters;
};

// Function to fetch filtered products
const applyFilters = async () => {
  const filters = getFilters();

  const queryString = new URLSearchParams(filters).toString();
  console.log(queryString)

  try {
    const response = await fetch(`/products/p?${queryString}`);
    const filteredProducts = await response.json();
    showProducts(filteredProducts);
  } catch (error) {
    console.error("Error applying filters:", error);
    alert("Something went wrong while applying filters.");
  }
};

// event listeners to filters
priceOrder.addEventListener("change", applyFilters);
rating.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters)
isFeaturedCheckbox.addEventListener("change", applyFilters);
isNewCheckbox.addEventListener("change", applyFilters);
isPopularCheckbox.addEventListener("change", applyFilters);
// event listeners to categories
categoryList.addEventListener("click", async (event) => {
  if (event.target.tagName === "LI") {
    categoryId = event.target.getAttribute("data-id");
    console.log("Selected Category ID:", categoryId);

    document.querySelectorAll("#categoryList li").forEach((li) => {
        li.classList.remove("category-selected");
    });

    event.target.classList.add("category-selected");

    applyFilters()
  }
});
