const showCategory = (categories) => {
  const tableBody = document.querySelector("#categoryTableBody");
  tableBody.innerHTML = "";

  if (categories.length > 0) {
    categories.forEach((category, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
              <td>${index + 1}</td>
              <td>${category.categoryName}</td>
              ${
                category.imagePath
                  ? `<td><img src="${category.imagePath}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>`
                  : `<td>No image added</td>`
              }
              
              <td>${new Date(category.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}</td>
              <td>${new Date(category.updatedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}</td>
              <td>${category.isListed ? "Yes" : "No"}</td>
              <td><a href="/admin/offers/apply/${
                category._id
              }?type=category" class="btn btn-primary btn-sm mt-2">Offer</a></td>
              <td>
                  <button onclick="toggleCategory('${
                    category._id
                  }')" class="btn ${
        category.isListed ? "btn-danger" : "btn-success"
      } btn-sm">
                    ${category.isListed ? "Unlist" : "List"}
                  </button>
                <a href="/admin/categories/edit/${
                  category._id
                }" class="btn btn-primary btn-sm">Edit</a>
              </td>
            `;

      tableBody.appendChild(row);
    });
  } else {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-muted">Nothing to show</td></tr>`;
  }
};

// get all category
const getCategories = async (page = 0, search = "") => {
  try {
    let url = `/admin/categories/all?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      updatePaginators(data.hasMore)
      showCategory(data.categoriesArray);
    } else {
      alert("Somthing went wrong");
      showCategory([]);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Internal server error");
    showCategory([]);
  }
};

const searchForm = document.querySelector(".search-form");
const query = document.getElementById("query");

if (searchForm && query) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const trimmedQuery = query.value.trim();
    if (trimmedQuery) {
      getCategories(0, trimmedQuery);
    }
  });
}

query.addEventListener("input", () => {
  if (query.value.trim() === "") {
    getCategories();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  getCategories();
});

async function toggleCategory(categoryId) {
  try {
    console.log(categoryId);
    const res = await fetch(`/admin/categories/toggle-listed/${categoryId}`, {
      method: "PATCH",
    });

    const result = await res.json();
    if (!res.ok) {
      toastr.error(result.error);
    }

    toastr.success(result.message);
    getCategories();
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
}

let page = 0;
const nxtBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
// update paginators
function updatePaginators(hasMore) {
  nxtBtn.disabled = !hasMore;
  prevBtn.disabled = page === 0;
}

// method to next page
nxtBtn.addEventListener("click", () => {
  page++;
  getCategories(page);
});

// method to previous page
prevBtn.addEventListener("click", () => {
  page--;
  getCategories(page);
});
