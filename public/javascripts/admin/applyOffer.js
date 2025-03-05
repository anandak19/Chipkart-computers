const offersContainer = document.querySelector(".offers-container");
let page = 0;

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

const showOffers = (offers) => {
  offersContainer.innerHTML = "";
  if (offers.length > 0) {
    //show

    offers.forEach((offer) => {
      const offerCard = document.createElement("div");
      offerCard.classList.add("offer-card");
      offerCard.innerHTML = `
            <h3 class="offer-title">${offer.offerTitle}</h3>
            <p class="offer-percentage">Discount: ${offer.discount}%</p>
            <p class="offer-dates">
              <span>Start: ${formatDate(offer.startDate)}</span> <br />
              <span>End: ${formatDate(offer.endDate)}</span>
            </p>
            ${
              offer.isSelected
                ? `<button class="apply-offer-btn" onclick="removeOffer()">Remove Offer</button>`
                : `<button class="apply-offer-btn" onclick="applyOffer('${offer._id}')">Apply Offer</button>`
            }
          `;
      offersContainer.appendChild(offerCard);
    });
  } else {
    offersContainer.innerHTML =
      '<p class="text-muted text-center">No offers available at this moment</p>';
  }
};


const updatePaginators = (hasMore) => {};

const getAvailbleOffers = async (page = 0) => {
  try {
    const url = `/admin/offers/apply/available/all?page=${page}`;
    const res = await fetch(url);

    const result = await res.json();

    console.log(result);
    if (res.ok) {
      console.log(result);
      showOffers(result.availableOffers);
    } else {
      alert(result.error || "Somthing went wrong");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};


// apply offer to product or product in category
async function applyOffer(offerId) {
  try {
    const res = await fetch(`/admin/offers/apply/available/all/${offerId}`, {
      method: 'PATCH'
    })
    const result = await res.json()
    if(res.ok) {
      alert(result.message)
      getAvailbleOffers()
    }else{
      alert(result.error)
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong")
  }
}

// remove offer from the selected product/category products
async function removeOffer() {
  try {
    const res = await fetch(`/admin/offers/apply/available/remove-offer`, {
      method: 'PATCH'
    })
    const result = await res.json()
    if(res.ok) {
      alert(result.message)
      getAvailbleOffers()
    }else{
      alert(result.error)
    }
    
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong")
  }
}


document.addEventListener("DOMContentLoaded", () => {
  getAvailbleOffers();
});

const nextPage = () => {
  page++;
  getAvailbleOffers(page);
};

const prevPage = () => {
  page--;
  getAvailbleOffers(page);
};
