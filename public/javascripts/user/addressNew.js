const addressForm = document.getElementById("addressForm");
// inputs
const addressTypeInput = document.getElementById("addressType");
const fullNameInput = document.getElementById("fullName");
const phoneNumberInput = document.getElementById("phoneNumber");
const addressLineInput = document.getElementById("addressLine");
const cityInput = document.getElementById("city");
const stateInput = document.getElementById("state");
const pincodeInput = document.getElementById("pincode");
const countryInput = document.getElementById("country");
const landmarkInput = document.getElementById("landmark");
const isDefaultInput = document.getElementById("isDefault");

// error messages
const addressTypeError = document.getElementById("addressTypeError");
const fullNameError = document.getElementById("fullNameError");
const phoneNumberError = document.getElementById("phoneNumberError");
const addressLineError = document.getElementById("addressLineError");
const cityError = document.getElementById("cityError");
const pincodeError = document.getElementById("pincodeError");
const serverMessage = document.getElementById("serverMessage");
// rgex
const nameRegex = /^[a-zA-Z\s]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10,13}$/;
const pincodeRegex = /^\d{6}$/;

// on submitting the form
addressForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const addressType = addressTypeInput.value;
  const fullName = fullNameInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();
  const addressLine = addressLineInput.value.trim();
  const city = cityInput.value.trim();
  const state = stateInput.value;
  const pincode = pincodeInput.value.trim();
  const country = countryInput.value;
  const landmark = landmarkInput.value.trim();
  const isDefault = isDefaultInput.checked;

  let isValid = true;
  addressTypeError.innerText = "";
  fullNameError.innerText = "";
  phoneNumberError.innerText = "";
  addressLineError.innerText = "";
  cityError.innerText = "";
  pincodeError.innerText = "";
  serverMessage.innerText = "";

  if (!addressType) {
    isValid = false;
    addressTypeError.innerText = "Choose an address type";
  }

  if (!fullName) {
    isValid = false;
    fullNameError.innerText = "Enter a valid name";
  } else if (!nameRegex.test(fullName)) {
    isValid = false;
    fullNameError.innerText = "Name should contain only letters and spaces";
  }

  if (!phoneNumber) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number";
  } else if (!phoneNumberRegex.test(phoneNumber)) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number (10-13 digits)";
  }

  if (!addressLine) {
    isValid = false;
    addressLineError.innerText = "Enter a valid phone number";
  }

  if (!city) {
    isValid = false;
    cityError.innerText = "Enter a valid city";
  }

  if (!pincode) {
    isValid = false;
    pincodeError.innerText = "Enter a valid pincode";
  } else if (!pincodeRegex.test(pincode)) {
    isValid = false;
    pincodeError.innerText = "Pincode should be 6 digits";
  }

  if (isValid) {
    const requestBody = {
      addressType,
      fullName,
      phoneNumber,
      addressLine,
      city,
      state,
      pincode,
      country,
      landmark,
      isDefault,
    };

    try {
      const response = await fetch("/account/address/new", {
        method: "POST",
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
      addressForm.reset()
    } catch (error) {
      console.error("Error adding address:", error);
      alert("Failed to add address. Please try again.");
    }
  }
});
