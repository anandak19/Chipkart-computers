function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

const showOffers = (offers) => {
  const offerTableBody = document.getElementById("offerTableBody");

  offerTableBody.innerHTML = "";

  if (offers.length > 0) {
    offers.forEach((offer, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                  <td>${index + 1}</td>
                  <td>${offer.offerTitle}</td>
                  <td>${offer.discount}</td>
                  <td>${formatDate(offer.startDate)}</td>
                  <td>${formatDate(offer.endDate)}</td>
                  <td>${offer.offerTarget}</td>
                  <td>${offer.isActive ? "Yes" : "No"}</td>
                  <td>
                      <a href="/admin/offers/edit/${
                        offer._id
                      }" class="btn btn-primary btn-sm">Edit</a>
                      <button class="btn ${
                        offer.isActive ? "btn-danger" : "btn-success"
                      }  btn-sm" onclick="toggleStatus('${offer._id}')">${
        offer.isActive ? "Make Inactive" : "Make Active"
      }</button>
                  </td>
              `;
      offerTableBody.appendChild(row);
    });
  } else {
    console.log("nop");
  }
};

const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
let page = 0;
const updatePaginators = (hasMore) => {
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore;
};

const getAllOffer = async (page = 0, search = "") => {
  try {
    let url = `/admin/offers/all?page=${page}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url);
    const result = await res.json();

    if (res.ok) {
      updatePaginators(result.hasMore);
      showOffers(result.offers);
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAllOffer(0);
});

prevBtn.addEventListener("click", () => {
  page--;
  getAllOffer(page);
});

nextBtn.addEventListener("click", () => {
  page++;
  getAllOffer(page);
});

async function toggleStatus(offerId) {
  try {
    const res = await fetch(`/admin/offers/unlist/${offerId}`, {
      method: "PATCH",
    });
    const result = await res.json();
    if (res.ok) {
      console.log(result.message);
      getAllOffer(page);
    } else {
      console.error(result.error);
      alert(result.error || "Somthing went wrong");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
}

const query = document.getElementById("query");
const searchForm = document.querySelector(".search-form");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const errorMessage = document.getElementById("errorMessage");
  const search = query.value.trim();
  errorMessage.innerText = "";
  let isValid = true;

  if (!search) {
    isValid = false;
    errorMessage.innerText = "Enter the offer name";
  }

  if (isValid) {
    console.log(search);
    getAllOffer(0, search);
  }
});

query.addEventListener("input", () => {
  if (query.value === "") {
    getAllOffer(0);
  }
});
