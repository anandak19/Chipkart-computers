const offerForm = document.getElementById("offerForm");

const offerTitle = document.getElementById("offerTitle");
const discount = document.getElementById("discount");
const category= document.getElementById("category");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

// errors
const offerTitleError = document.getElementById("offerTitleError");
const discountError = document.getElementById("discountError");
const startDateError = document.getElementById("startDateError");
const endDateError = document.getElementById("endDateError");

// on submitting offer form
offerForm.addEventListener("submit", async(e) => {
  e.preventDefault();

  offerTitleError.innerHTML = "";
  discountError.innerHTML = "";
  startDateError.innerHTML = "";
  endDateError.innerHTML = "";

  const offerTitleInput = offerTitle.value.trim();
  const discountInput = discount.value.trim();
  const startDateInput = startDate.value
  const endDateInput = endDate.value


  if(offerTitleInput.length < 5 || !offerTitleInput){
    offerTitleError.innerHTML = 'Offer title should have minimum 5 charecters'
    return
  }
  
  if (discountInput >= 100 || !discountInput) {
    discountError.innerHTML = 'Enter a valid discount percentage'
    return 
  }



  const today = new Date();

  today.setHours(0, 0, 0, 0);
  
  const selectedStartDate = new Date(startDateInput);
  const selectedEndDate = new Date(endDateInput);
  
  selectedStartDate.setHours(0, 0, 0, 0);

  if (!endDateInput || selectedEndDate <= today) {
    endDateError.innerHTML = "End date must be in the future.";
    return
  }

  if (selectedEndDate <= selectedStartDate) {
    endDateError.innerHTML = "End date should be greater than start date.";
    return
  }

  const newOffer = {
    offerTitle: offerTitleInput,
    discount: discountInput,
    startDate: selectedStartDate,
    endDate: selectedEndDate
  }

  try {
    const res = await fetch('/admin/offers/edit/offer/details', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newOffer)
    })

    const result = await res.json()
    if (res.ok) {
      alert(result.message)
    }else{
      alert(result.error)
    }
    
  } catch (error) {
    console.error(error);
    alert('Somthing went wrong')
  }

});

const formatDate = (date) => {
  date = new Date(date);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const showOffeDetails = (offer) => {
  offerTitle.value = offer.offerTitle
  discount.value = offer.discount
  category.value = offer.category
  startDate.value = formatDate(offer.startDate);
  endDate.value = formatDate(offer.endDate);
}

// method to get offer and show
const getOfferDetails = async() => {
    try {
        const res = await fetch('/admin/offers/edit/offer/details')
        const result = await res.json()
        if (res.ok) {
            console.log(result.offer)
            showOffeDetails(result.offer)
        }else{
            alert("Error fetching offer details")
        }
    } catch (error) {
        console.error(error);
        alert('Error fetching offer')
    }
}

document.addEventListener('DOMContentLoaded', getOfferDetails)
