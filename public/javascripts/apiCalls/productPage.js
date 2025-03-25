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
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");

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
      const rating =
        product.averageRating === 0 ? "0" : product.averageRating.toFixed(1);
      const productCard = `
          <div class="product-card">
            <div class="product-card-image">
              <img src="${imageUrl}" alt="${
        product.productName || "Default Product"
      }" />
            </div>
            <div class="product-card-details">
              <h4>
                <a href="/products/${product._id}">${
        product.productName || "Unnamed Product"
      }</a>
              </h4>
              <div class="rating-price">
                <div class="price">
                  <p class="selling-price">₹${product.finalPrice || "N/A"}</p>
                  <p class="actual-price">₹${product.mrp || "N/A"}</p>
                </div>
                <div class="item-rating">
                    <span>&#9733; ${rating}</span>
                </div>
              </div>
            </div>
            <div class="product-actions">
            ${
              product.quantity === 0
                ? `<button class="out-of-stock" disabled>Out of Stock</button>`
                : `<button class="add-cart" onClick="addToCart('${product._id}')">Add Cart</button>`
            }
              <span class="wishlist-icon ${product.isWishlisted? 'wishlist-selected': 'wishlist-default'}" onClick="addWishlist('${product._id}')">
              <i class="fa-heart ${product.isWishlisted? 'fa-solid': 'fa-regular'}"></i>
              </span>
            </div>
          </div>
        `;

      productList.insertAdjacentHTML("beforeend", productCard);
    });
  }
};


// // wishlited icon
// {/* <i class="fa-solid fa-heart"></i> */}
// setAttribute("data-wishlisted", "true");
// classList.add("wishlisted");

// on page load method
async function fetchProducts() {
  try {
    const response = await fetch("/products/p");
    const { products, total, hasMore } = await response.json();
    console.log(products[0]);

    showProducts(products, total, hasMore);
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Something went wrong");
  }
}
document.addEventListener("DOMContentLoaded", fetchProducts);

// Function to get selected filters
const filters = {};
const getFilters = () => {
  if (priceOrder.value) filters.priceOrder = priceOrder.value;
  if (sortBy.value) filters.sortBy = sortBy.value;
  if (rating.value) filters.ratingsAbove = rating.value;
  if (isFeaturedCheckbox.checked) filters.isFeatured = true;
  if (isNewCheckbox.checked) filters.isNew = true;
  if (isPopularCheckbox.checked) filters.ratingsAbove = 4;
  if (categoryId) {
    filters.categoryId = categoryId;
  }
  filters.page = page;

  console.log(filters);
  return filters;
};

// Function to fetch filtered products
const applyFilters = async () => {
  const filters = getFilters();
  console.log(filters);

  const queryString = new URLSearchParams(filters).toString();
  console.log(queryString);

  try {
    const response = await fetch(`/products/p?${queryString}`);
    const { products, total, hasMore } = await response.json();

    showProducts(products, total, hasMore);
  } catch (error) {
    console.error("Error applying filters:", error);
    alert("Something went wrong while applying filters.");
  }
};

// event listeners to filters
// for price order
priceOrder.addEventListener("change", () => {
  if (priceOrder.value.trim() === "") {
    delete filters.priceOrder;
  }
  applyFilters();
});

// for rating
rating.addEventListener("change", () => {
  if (rating.value.trim() === "") {
    delete filters.ratingsAbove;
  }
  applyFilters();
});

// for sort
sortBy.addEventListener("change", () => {
  delete filters.sortBy;
  applyFilters();
});

// for is featured
isFeaturedCheckbox.addEventListener("change", () => {
  delete filters.isFeatured;
  applyFilters();
});

// for is new check box
isNewCheckbox.addEventListener("change", () => {
  delete filters.isNew;
  applyFilters();
});

// for is popular
isPopularCheckbox.addEventListener("change", () => {
  delete filters.ratingsAbove;
  applyFilters();
});

// event listeners to categories
categoryList.addEventListener("click", async (event) => {
  if (event.target.tagName === "LI") {
    const selectedCategory = event.target;
    const isSelected = selectedCategory.classList.contains("category-selected");

    document.querySelectorAll("#categoryList li").forEach((li) => {
      li.classList.remove("category-selected");
    });

    if (!isSelected) {
      selectedCategory.classList.add("category-selected");
      categoryId = selectedCategory.getAttribute("data-id");
      console.log("Selected Category ID:", categoryId);
      page = 0
      applyFilters();
    } else {
      categoryId = null
      delete filters.categoryId
      console.log("Category deselected");
      applyFilters(); 
    }
  }
});


// for search box input
searchBox.addEventListener("input", () => {
  if (searchBox.value.trim() === "") {
    console.log("removed search");
    delete filters.search;
    applyFilters();
  } else {
    filters.search = searchBox.value;
  }
});

searchBtn.addEventListener("click", () => {
  delete filters.search;
  page = 0;
  filters.search = searchBox.value;
  applyFilters();
});

nextBtn.addEventListener("click", () => {
  page++;
  applyFilters();
});

prevBtn.addEventListener("click", () => {
  page--;
  applyFilters();
});


// add to wishlist 
async function addWishlist(id) {
  const url = `/products/wishlist/add/${id}`
  try {
    const res = await fetch(url, {
      method: 'POST'
    })

    const result = await res.json() 
    if (res.ok) {
      applyFilters();
      getWishlistCount()
    }else{
      alert(result.error)
    }
  } catch (error) {
    console.error(error);
    alert('Error adding to wishlist')
  }
}