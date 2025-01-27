const priceOrder = document.getElementById("priceOrder");
const sortBy = document.getElementById("sortBy");
const rating = document.getElementById("rating");
const isFeaturedCheckbox = document.getElementById("isFeatured");
const isNewCheckbox = document.getElementById("isNew");
const isPopularCheckbox = document.getElementById("isPopular");
const categoryList = document.getElementById("categoryList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const resultCount = document.getElementById("resultCount");

let categoryId;
let page = 0;

// to display products with details
const showProducts = (products, total, hasMore) => {
  const productList = document.getElementById("productList");
  if (!products || products.length === 0) {
    productList.innerHTML = "No Products to show";
    nextBtn.style.display = "none";
    prevBtn.style.display = "none";
    resultCount.innerHTML = `${total} Results`;
  } else {
    productList.innerHTML = "";
    resultCount.innerHTML = `${total} Results`;
    nextBtn.style.display = "flex";
    prevBtn.style.display = "flex";
    nextBtn.disabled = !hasMore;
    prevBtn.disabled = page === 0;
    products.forEach((product) => {
      const imageUrl =
        product.images && product.images.length > 0
          ? product.images[0].filepath
          : "/images/default/default.jpg";
      const productCard = `
          <div class="product-card">
            <div class="product-card-image">
              <img src="${imageUrl}" alt="${product.productName || 'Default Product'}" />
            </div>
            <div class="product-card-details">
              <h4>
                <a href="/products/${product._id}">${product.productName || 'Unnamed Product'}</a>
              </h4>
              <div class="price">
            <p class="selling-price">${product.finalPrice || 'N/A'}</p>
            <p class="actual-price">${product.mrp || 'N/A'}</p>
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
  }
};

// on page load method
async function fetchProducts() {
  try {
    const response = await fetch("/products/p");
    const { products, total, hasMore } = await response.json();

    showProducts(products, total, hasMore);
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
    filters.categoryId = categoryId;
  }
  filters.page = page;

  return filters;
};

// Function to fetch filtered products
const applyFilters = async () => {
  const filters = getFilters();

  const queryString = new URLSearchParams(filters).toString();
  console.log(queryString);

  try {
    const response = await fetch(`/products/p?${queryString}`);
    const { products, total, hasMore } = await response.json();
    console.log(products);

    showProducts(products, total, hasMore);
  } catch (error) {
    console.error("Error applying filters:", error);
    alert("Something went wrong while applying filters.");
  }
};

// event listeners to filters
priceOrder.addEventListener("change", applyFilters);
rating.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters);
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

    applyFilters();
  }
});

nextBtn.addEventListener("click", () => {
  page++;
  applyFilters();
});

prevBtn.addEventListener("click", () => {
  page--;
  applyFilters();
});
