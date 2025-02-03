const personalDetailsForm = document.getElementById("detailsForm");
const userName = document.getElementById("name");
const phoneNumber = document.getElementById("phoneNumber");
const email = document.getElementById("email");
const dob = document.getElementById("dob");
// errors
const nameError = document.getElementById("nameError");
const phoneNumberError = document.getElementById("phoneNumberError");
const emailError = document.getElementById("emailError");
const dobError = document.getElementById("dobError");
const serverError = document.getElementById("serverError");
// btns
const editBtn = document.getElementById("editBtn");
const detailsSaveBtn = document.getElementById("detailsSaveBtn");
// regex
const nameRegex = /^[a-zA-Z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10,13}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{4,}$/;

// get users details and show
const getUserDetails = () => {
  //call api to get users data
  fetch("/account/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    })
    .then((data) => {
      console.log("User data:", data);

      userName.value = data.name;
      email.value = data.email;
      phoneNumber.value = data.phoneNumber || null;
      dob.value = data.dob || null;
    })
    .catch((error) => {
      console.error("Error fetching user details:", error);
    });
};

// on edit btn click
editBtn.addEventListener("click", () => {
  userName.removeAttribute("readonly");
  phoneNumber.removeAttribute("readonly");
  email.removeAttribute("readonly");
  dob.removeAttribute("readonly");
  detailsSaveBtn.style.display = "flex";
});

// on submitting updated personal details
personalDetailsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  nameError.innerText = "";
  phoneNumberError.innerText = "";
  emailError.innerText = "";
  dobError.innerText = "";
  serverError.innerText = "";

  let isValid = true;

  const nameInput = userName.value.trim();
  const phoneNumberInput = phoneNumber.value.trim();
  const emailInput = email.value.trim();
  const dobInput = dob.value.trim();

  if (!nameInput || !nameRegex.test(nameInput)) {
    isValid = false;
    nameError.innerText = "Enter a valid name! Name can only have letters";
  }

  if (!phoneNumberInput || !phoneNumberRegex.test(phoneNumberInput)) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number";
  }

  if (!emailInput || !emailRegex.test(emailInput)) {
    isValid = false;
    emailError.innerText = "Enter a valid email address";
  }

  if (!dobInput) {
    isValid = false;
    dobError.innerText = "Enter a valid date of birth";
  }

  if (isValid) {
    const body = {
      name: nameInput,
      email: emailInput,
      phoneNumber: phoneNumberInput,
      dob: dobInput,
    };

    fetch("/account/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          ok: response.ok,
        };
      })
      .then(({ data, ok }) => {
        if (!ok) {
          serverError.innerText = data.error || "Something went wrong";
        } else {
          // add a custom toster message for succes here 
          alert(data.message)
          location.reload();
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        serverError.innerText = "Network error. Please try again!";
      });
  }
});

// on page loaded, user data will be fetched
document.addEventListener("DOMContentLoaded", getUserDetails);

// ---------RESET PASSWORD 






/*
-for password change
when user types old password, show save btn 

on save btn click or form submit - 
validate each field and validate new password format too
// if the old password enterd by user is wrong , validate that from the server and send error message
if all are valid save password - logout user from the server
after successfull password reset relaod the page to redierct user to login page, since user have no session
*/
