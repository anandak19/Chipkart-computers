const personalDetailsForm = document.getElementById("detailsForm");
const userName = document.getElementById("name");
const phoneNumber = document.getElementById("phoneNumber");
const dob = document.getElementById("dob");
// errors
const nameError = document.getElementById("nameError");
const phoneNumberError = document.getElementById("phoneNumberError");
const dobError = document.getElementById("dobError");
const serverError = document.getElementById("serverError");
// btns
const editBtn = document.getElementById("editBtn");
const detailsSaveBtn = document.getElementById("detailsSaveBtn");
// regex
const nameRegex = /^[a-zA-Z\s]+$/;
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
  dob.removeAttribute("readonly");
  detailsSaveBtn.style.display = "flex";
});

// on submitting updated personal details
personalDetailsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  nameError.innerText = "";
  phoneNumberError.innerText = "";
  dobError.innerText = "";
  serverError.innerText = "";

  let isValid = true;

  const nameInput = userName.value.trim();
  const phoneNumberInput = phoneNumber.value.trim();
  const dobInput = dob.value.trim();

  if (!nameInput || !nameRegex.test(nameInput)) {
    isValid = false;
    nameError.innerText = "Enter a valid name! Name can only have letters";
  }

  if (!phoneNumberInput || !phoneNumberRegex.test(phoneNumberInput)) {
    isValid = false;
    phoneNumberError.innerText = "Enter a valid phone number";
  }

  if (!dobInput) {
    isValid = false;
    dobError.innerText = "Enter a valid date of birth";
  }

  if (isValid) {
    const body = {
      name: nameInput,
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
          toastr.success(data.message, "Success");
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      })
      .catch((error) => {
        alert("Somthing went wrong")
        console.error("Fetch error:", error);
        serverError.innerText = "Network error. Please try again!";
      });
  }
});

// on page loaded, user data will be fetched
document.addEventListener("DOMContentLoaded", getUserDetails);

// ---------RESET PASSWORD

const passwordForm = document.getElementById("passwordForm");
const oldPassword = document.getElementById("oldPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const savePassBtn = document.getElementById("savePassBtn");
// errors
const oldPassError = document.getElementById("oldPassError");
const newPassError = document.getElementById("newPassError");
const confirmPassError = document.getElementById("confirmPassError");
const passServerMsg = document.getElementById("passServerMsg");

const savePassword = async () => {
  let isValid = true;

  oldPassError.innerText = "";
  newPassError.innerText = "";
  confirmPassError.innerText = "";
  passServerMsg.innerText = "";

  const oldPasswordInput = oldPassword.value.trim();
  const newPasswordInput = newPassword.value.trim();
  const confirmPasswordInput = confirmPassword.value.trim();

  if (!oldPasswordInput) {
    isValid = false;
    oldPassError.innerText = "Enter your old password";
  }

  if (!newPasswordInput || !passwordRegex.test(newPasswordInput)) {
    isValid = false;
    newPassError.innerText =
      "Password must be at least 4 characters long and include at least one letter and one number.";
  }

  if (confirmPasswordInput !== newPasswordInput) {
    isValid = false;
    confirmPassError.innerText = "Password does not match";
  }

  if (isValid) {
    try {
      const body = {
        oldPassword: oldPasswordInput,
        newPassword: newPasswordInput,
        confirmPassword: confirmPasswordInput,
      };

      const response = await fetch("/account/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        passServerMsg.classList.remove("text-danger");
        passServerMsg.classList.add("text-success");
        passServerMsg.innerText = data.message;
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else {
        passServerMsg.innerText = data.error;
      }
    } catch (error) {
      console.log("Error:", error);
      alert("Somthing went wrong");
    }
  }
};

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await savePassword()
});

savePassBtn.addEventListener("click", savePassword)
