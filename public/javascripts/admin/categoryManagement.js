const showCategory = (categories) => {
  const tableBody = document.querySelector("#categoryTableBody");
  tableBody.innerHTML = "";

  if (categories.length > 0) {
    categories.forEach((category, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
              <td>${index + 1}</td>
              <td>${category.categoryName}</td>
              ${category.imagePath
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
              <td>
                <form action="/admin/categories/toggle-listed/${
                  category._id
                }" method="post" style="display: inline">
                  <button class="btn ${
                    category.isListed ? "btn-danger" : "btn-success"
                  } btn-sm">
                    ${category.isListed ? "Unlist" : "List"}
                  </button>
                </form>
                <a href="/admin/categories/edit/${
                  category._id
                }" class="btn btn-primary btn-sm">Edit</a>
              </td>
            `;

      tableBody.appendChild(row);
    });
  }else{
    const row = document.createElement("tr");
    row.innerHTML = "Nothing to show"
    tableBody.appendChild(row);
  }
};

// get all category
const getCategories = async (search = "") => {
  try {
    let url = "/admin/categories/all";
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      showCategory(data.data);
    } else {
      alert("Somthing went wrong")
      showCategory([]);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Internal server error")
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
            getCategories(trimmedQuery);
        }
    });
}

const resetBtn = document.getElementById("resetBtn")
resetBtn.addEventListener("click", () => {
    getCategories();
})

document.addEventListener("DOMContentLoaded", () => {
  getCategories();
});
