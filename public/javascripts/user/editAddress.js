const editAddressForm = document.getElementById("editAddressForm");

const addressType = document.getElementById("addressType");
const fullName = document.getElementById("fullName");
const phoneNumber = document.getElementById("phoneNumber");
const addressLine = document.getElementById("addressLine");
const city = document.getElementById("city");
const state = document.getElementById("state");
const pincode = document.getElementById("pincode");
const country = document.getElementById("country");
const landmark = document.getElementById("landmark");
const isDefault = document.getElementById("isDefault");
// rgex
const nameRegex = /^[a-zA-Z\s]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10,13}$/;
const pincodeRegex = /^\d{6}$/;
// error messages
const addressTypeError = document.getElementById("addressTypeError");
const fullNameError = document.getElementById("fullNameError");
const phoneNumberError = document.getElementById("phoneNumberError");
const addressLineError = document.getElementById("addressLineError");
const cityError = document.getElementById("cityError");
const pincodeError = document.getElementById("pincodeError");
const serverMessage = document.getElementById("serverMessage");

const showAddressDetails = (address) => {
  addressType.value = address.addressType || "";
  fullName.value = address.fullName || "";
  phoneNumber.value = address.phoneNumber || "";
  addressLine.value = address.addressLine || "";
  city.value = address.city || "";
  state.value = address.state || "Kerala";
  pincode.value = address.pincode || "";
  country.value = address.country || "India";
  landmark.value = address.landmark || "";
  isDefault.checked = address.isDefault || false;
};

const getAddressDetails = async () => {
  try {
    const response = await fetch("/account/address/address-details");
    const data = await response.json();

    if (!response.ok) {
      alert(data.error);
    }
    showAddressDetails(data.addressDetails);
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAddressDetails();
});

// edit address
editAddressForm.addEventListener("submit", async(e) => {
  e.preventDefault();

  const addressTypeInput = addressType.value.trim();
  const fullNameInput = fullName.value.trim();
  const phoneNumberInput = phoneNumber.value.trim();
  const addressLineInput = addressLine.value.trim();
  const cityInput = city.value.trim();
  const stateInput = state.value.trim();
  const pincodeInput = pincode.value.trim();
  const countryInput = country.value.trim();
  const landmarkInput = landmark.value.trim();
  const isDefaultInput = isDefault.checked;

  let isValid = true;
  addressTypeError.innerText = "";
  fullNameError.innerText = "";
  phoneNumberError.innerText = "";
  addressLineError.innerText = "";
  cityError.innerText = "";
  pincodeError.innerText = "";
  serverMessage.innerText = "";

  if (!addressTypeInput) {
    isValid = false;
    addressTypeError.innerText = "Choose an address type";
  }

  if (!fullNameInput) {
    isValid = false;
    fullNameError.innerText = "Enter a valid name";
  } else if (!nameRegex.test(fullNameInput)) {
    isValid = false;
    fullNameError.innerText = "Name should contain only letters and spaces";
  }

  if (!phoneNumberInput) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number";
  } else if (!phoneNumberRegex.test(phoneNumberInput)) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number (10-13 digits)";
  }

  if (!addressLineInput) {
    isValid = false;
    addressLineError.innerText = "Enter a valid phone number";
  }

  if (!cityInput) {
    isValid = false;
    cityError.innerText = "Enter a valid city";
  }

  if (!pincodeInput) {
    isValid = false;
    pincodeError.innerText = "Enter a valid pincode";
  } else if (!pincodeRegex.test(pincodeInput)) {
    isValid = false;
    pincodeError.innerText = "Pincode should be 6 digits";
  }

  if (isValid) {
    const requestBody = {
      addressType: addressTypeInput,
      fullName: fullNameInput,
      phoneNumber: phoneNumberInput,
      addressLine: addressLineInput,
      city: cityInput,
      state: stateInput,
      pincode: pincodeInput,
      country: countryInput,
      landmark: landmarkInput,
      isDefault: isDefaultInput,
    };


    try {
        const response = await fetch("/account/address/edit", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          toastr.error(data.error || "Server Error")
        }
  
        serverMessage.classList.remove('text-danger')
        serverMessage.classList.add('text-success')
        console.log("Address added successfully:", data);
        toastr.success(data.message || "Address added successfully")
      } catch (error) {
        console.error("Error adding address:", error);
        alert("Failed to add address. Please try again.");
      }
  }
});
