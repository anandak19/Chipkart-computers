const newCouponForm = document.getElementById("newCouponForm");

const couponCode = document.getElementById("couponCode");
const discount = document.getElementById("discount");
const minOrderAmount = document.getElementById("minOrderAmount");
const expirationDate = document.getElementById("expirationDate");
const description = document.getElementById("description");
const statusField = document.getElementById("status");

const couponCodeError = document.getElementById("couponCodeError");
const discountError = document.getElementById("discountError");
const minOrderAmountError = document.getElementById("minOrderAmountError");
const expirationDateError = document.getElementById("expirationDateError");
const descriptionError = document.getElementById("descriptionError");
const statusError = document.getElementById("statusError");

newCouponForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  couponCodeError.innerHTML = "";
  discountError.innerHTML = "";
  minOrderAmountError.innerHTML = "";
  expirationDateError.innerHTML = "";
  descriptionError.innerHTML = "";
  statusError.innerHTML = "";

  let isValid = true;

  const couponCodeInput = couponCode.value.trim();
  const discountInput = discount.value.trim();
  const minOrderAmountInput = minOrderAmount.value.trim();
  const expirationDateInput = expirationDate.value;
  const descriptionInput = description.value.trim();
  const statusInput = statusField.value.trim();


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
  const selectedDate = new Date(expirationDateInput);
  if (!expirationDateInput || selectedDate <= today) {
    expirationDateError.innerHTML = "Expiration date must be in the future.";
    return
  }

  if (descriptionInput.length < 10) {
    descriptionError.innerHTML = "Description must be at least 10 characters.";
    isValid = false;
    return;
  }

  if (!statusInput) {
    statusError.innerHTML = "Please select a status.";
    isValid = false;
    return;
  }

  if (isValid) {
    const newCoupon = {
      couponCode: couponCodeInput,
      discount: discountInput,
      minOrderAmount: minOrderAmountInput,
      expirationDate: expirationDateInput,
      description: descriptionInput,
      couponStatus: statusInput,
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
