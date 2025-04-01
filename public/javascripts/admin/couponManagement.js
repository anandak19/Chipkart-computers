// show all Coupons
const showCoupons = (coupons) => {
  const couponTableBody = document.getElementById("couponTableBody");

  couponTableBody.innerHTML = "";

  if (coupons.length > 0) {
    coupons.forEach((coupon, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${coupon.couponCode}</td>
                <td>${coupon.discount}</td>
                <td>${coupon.description}</td>
                <td>${coupon.minOrderAmount}</td>
                <td>${new Date(coupon.startDate).toLocaleDateString()}</td>
                <td>${new Date(coupon.endDate).toLocaleDateString()}</td>
                <td>${coupon.usedCount}</td>
                <td>
                    <a href="/admin/coupons/edit/${
                      coupon._id
                    }" class="btn btn-primary btn-sm">Edit</a>
                    <button class="btn ${
                        coupon.isActive ? "btn-danger"  : "btn-success" 
                        }  btn-sm" onclick="toggleStatus('${coupon._id}')">${
                            coupon.isActive ? "Make Inactive"  : "Make Active"
                    }</button>
                </td>
            `;
      couponTableBody.appendChild(row);
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

// get all Coupons
const getAllCoupons = async (page = 0, search = "") => {
  try {
    let url = `/admin/coupons/all?page=${page}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url);
    const result = await res.json();

    if (res.ok) {
      updatePaginators(result.hasMore);
      showCoupons(result.coupons);
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAllCoupons(0);
});

prevBtn.addEventListener("click", () => {
  page--;
  getAllCoupons(page);
});

nextBtn.addEventListener("click", () => {
  page++;
  getAllCoupons(page);
});

async function toggleStatus(couponId) {
  try {
    const res = await fetch(`/admin/coupons/unlist/${couponId}`, {
      method: "PATCH",
    });
    const result = await res.json();
    if (res.ok) {
      console.log(result.message);
      getAllCoupons(page);
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
    errorMessage.innerText = "Enter the coupon code";
  }

  if (isValid) {
    console.log(search);
    getAllCoupons(0, search);
  }
});

query.addEventListener("input", () => {
  if (query.value === "") {
    getAllCoupons(0);
  }
});
