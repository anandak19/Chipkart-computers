const couponsDiv = document.querySelector(".coupons-container");

// method to show the coupons
const showCoupons = (coupons) => {
  couponsDiv.innerHTML = "";
  if (coupons.length > 0) {
    coupons.forEach((coupon) => {
      const couponCard = document.createElement("div");
      couponCard.classList.add("coupon-card");
      couponCard.innerHTML = `
            <div class="offer-text">
              <p>${coupon.description}</p>
            </div>
          
            <div class="coupon-code">
              <p>Code: <span>${coupon.couponCode}</span></p>
            </div>
          
            <div class="coupon-details">
              <p>Valid till: <span>${new Date(
                coupon.endDate
              ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}</span></p>
            </div>
          
            <div class="min-order-amount">
              <p>Min Order: <span>₹${coupon.minOrderAmount}</span></p>
            </div>
          `;

      couponsDiv.appendChild(couponCard);
    });
  }
};

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
let page = 0;
const updatePaginators = (hasMore) => {
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore;
};

// method to get the coupons
const getAvailableCoupons = async (page = 0) => {
  const url = `/account/coupons/all?page=${page}`;
  try {
    const res = await fetch(url);

    const result = await res.json();

    if (res.ok) {
      showCoupons(result.availableCoupons);
      updatePaginators(result.hasMore)
    }
  } catch (error) {
    console.error(error);
  }
};

// method to run on dom load
document.addEventListener("DOMContentLoaded", () => {
  getAvailableCoupons();
});

prevBtn.addEventListener("click", () => {
  page--;
  getAvailableCoupons(page);
});

nextBtn.addEventListener("click", () => {
  page++;
  getAvailableCoupons(page);
});
