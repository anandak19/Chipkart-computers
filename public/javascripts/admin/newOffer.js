const offerForm = document.getElementById("offerForm");

const offerTitle = document.getElementById("offerTitle");
const discount = document.getElementById("discount");
const categoryDropdown = document.getElementById("category");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

// errors
const offerTitleError = document.getElementById("offerTitleError");
const discountError = document.getElementById("discountError");
const categoryError = document.getElementById("categoryError");
const startDateError = document.getElementById("startDateError");
const endDateError = document.getElementById("endDateError");

// on submitting offer form
offerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  offerTitleError.innerHTML = "";
  discountError.innerHTML = "";
  categoryError.innerHTML = "";
  startDateError.innerHTML = "";
  endDateError.innerHTML = "";

  const offerTitleInput = offerTitle.value.trim();
  const discountInput = discount.value.trim();
  const categoryInput = categoryDropdown.value;
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

  if(!categoryInput) {
    categoryError.innerHTML= 'Choose a category'
    return
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  
  const selectedStartDate = new Date(startDateInput);
  const selectedEndDate = new Date(endDateInput);
  
  selectedStartDate.setHours(0, 0, 0, 0);
  
  if (!startDateInput || selectedStartDate < today) {
    startDateError.innerHTML = "Start date must be in the future or today.";
    return;
  }

  if (!endDateInput || selectedEndDate <= today) {
    endDateError.innerHTML = "End date must be in the future.";
    return
  }

  if (selectedEndDate <= selectedStartDate) {
    endDateError.innerHTML = "End date should be greater than start date.";
    return
  }

  const newOffer = {

  }
});

// method to get category and show
const getCategories = async() => {
    try {
        const res = await fetch('/admin/categories/available')
        const result = await res.json()
        if (res.ok) {
            console.log(result)

            result.data.forEach(category => {
                const option = document.createElement("option")
                option.value = category._id
                option.textContent = category.categoryName
                categoryDropdown.appendChild(option);
            });
        }else{
            alert("Error fetching categories")
        }
    } catch (error) {
        console.error(error);
        alert('Error fetching categories')
    }
}

document.addEventListener('DOMContentLoaded', getCategories)
