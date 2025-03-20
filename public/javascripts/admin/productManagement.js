const productsTableBody = document.getElementById("productsTableBody");

function generateProductRow(product, index) {
  return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <img 
            src="${
              product.images &&
              product.images.length > 0 &&
              product.images[0].filepath
                ? product.images[0].filepath
                : "/images/default/default.jpg"
            }" 
            alt="${product.productName}" 
            style="width: 100px; height: auto"
          />
        </td>
        <td>${product.productName}</td>
        <td>${product.categoryDetails?.categoryName || "N/A"}</td>
        <td>${product.brand}</td>
        <td>${product.mrp}</td>
        <td>${product.discount}</td>
        <td>${product.finalPrice}</td>
        <td>${product.quantity}</td>
        <td><a href="/admin/offers/apply/${
          product._id
        }?type=product" class="btn btn-primary btn-sm mt-2">Offer</a></td>
        <td>
            <button onclick="toggleProduct('${product._id}')" class="btn ${
    product.isListed ? "btn-danger" : "btn-success"
  } btn-sm toggleBtn" >
              ${product.isListed ? "Unlist" : "List"}
            </button>
          <a href="/admin/products/edit/${
            product._id
          }" class="btn btn-primary btn-sm mt-2">Edit</a>
        </td>
      </tr>
    `;
}

// Method to show products in the table
const showProducts = (productsArray) => {
  if (productsArray.length > 0) {
    productsTableBody.innerHTML = productsArray
      .map(generateProductRow)
      .join("");
  } else {
    productsTableBody.innerHTML = `<tr><td colspan="12" class="text-center">No products found</td></tr>`;
  }
};

// method to call products in db
let page = 0;
let hasMore = false;
const getAllProducts = async (page = 0, q = "") => {
  try {
    let url = `/admin/products/all?page=${page}`;
    if (q) {
      url += `&q=${q}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      console.log(data);
      showProducts(data.productsArray);
      updatePaginators(data.hasMore);
    } else {
      alert(data.error || "Somthing went wrong");
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching products");
  }
};

// dom load method
document.addEventListener("DOMContentLoaded", () => {
  getAllProducts();
});

// method to toggle product visibility
async function toggleProduct(productId) {
  try {
    const res = await fetch(`/admin/products/toggle-listed/${productId}`, {
      method: "PATCH",
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error);
    }

    toastr.success(result.message);
    getAllProducts();
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
}

// ---------------------------

// method to search a proudct
const searchForm = document.querySelector(".search-form");
const searchInput = document.getElementById("query");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query || query.length < 2) {
    toastr.error("Enter a product name to search");
    return;
  }
  getAllProducts(0, query);
});

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    getAllProducts();
  }
});

const nxtBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");

function updatePaginators(hasMore) {
  prevBtn.disabled = page === 0;
  nxtBtn.disabled = !hasMore;
}

// method to next page
nxtBtn.addEventListener("click", () => {
  page++;
  getAllProducts(page);
});

// method to previous page
prevBtn.addEventListener("click", () => {
  page--;
  getAllProducts(page);
});
