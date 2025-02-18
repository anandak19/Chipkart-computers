const newCouponForm = document.getElementById("newCouponForm");

const couponCode = document.getElementById("couponCode");
const discount = document.getElementById("discount");
const minOrderAmount = document.getElementById("minOrderAmount");
const startDate  = document.getElementById("startDate");
const endDate  = document.getElementById("endDate");
const description = document.getElementById("description");

const couponCodeError = document.getElementById("couponCodeError");
const discountError = document.getElementById("discountError");
const minOrderAmountError = document.getElementById("minOrderAmountError");
const startDateError = document.getElementById("startDateError");
const endDateError = document.getElementById("endDateError");
const descriptionError = document.getElementById("descriptionError");

newCouponForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  couponCodeError.innerHTML = "";
  discountError.innerHTML = "";
  minOrderAmountError.innerHTML = "";
  startDateError.innerHTML = "";
  endDateError.innerHTML = "";
  descriptionError.innerHTML = "";

  let isValid = true;

  const couponCodeInput = couponCode.value.trim();
  const discountInput = discount.value.trim();
  const minOrderAmountInput = minOrderAmount.value.trim();
  const startDateInput = startDate.value;
  const endDateInput = endDate.value;
  const descriptionInput = description.value.trim();


  if (couponCodeInput.length !== 5 || !couponCodeInput) {
    couponCodeError.innerHTML = "Coupon code must have 5 charecters only";
    isValid = false;
    return;
  }

  if (!discountInput || discountInput <= 0 || discountInput > 100) {
    discountError.innerHTML =
      "Discount must be a positive number less than 100";
    isValid = false;
    return;
  }

  if (!minOrderAmountInput || minOrderAmountInput <= 0) {
    minOrderAmountError.innerHTML =
      "Minimum order amount must be greater than 0.";
    isValid = false;
    return;
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

  if (descriptionInput.length < 10) {
    descriptionError.innerHTML = "Description must be at least 10 characters.";
    isValid = false;
    return;
  }

  if (isValid) {
    const newCoupon = {
      couponCode: couponCodeInput,
      discount: discountInput,
      minOrderAmount: minOrderAmountInput,
      startDate: startDateInput,
      endDate: endDateInput,
      description: descriptionInput,
    };

    try {
        const res = await fetch('/admin/coupons/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCoupon)
        })

        const result = await res.json()
        if(res.ok) {
            toastr.success(result.message || "Success")
            newCouponForm.reset()
        }else{
            toastr.warning(result.message || "Somthing went wrong")
        }
        
    } catch (error) {
        console.error(error);
        alert("Somthing went wrong")
    }
  }
});
