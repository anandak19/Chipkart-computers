const fullNameRegex = /^[a-zA-Z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();

  const fullName = document.getElementById("name").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  let isValid = true;

  if (
    !fullName ||
    fullName.length < 3 ||
    fullName.length > 20 ||
    !fullNameRegex.test(fullName)
  ) {
    document.getElementById("nameAlert").innerHTML =
      "Please enter a valid name (3-20 characters, no numbers or special characters).";
    isValid = false;
  } else {
    document.getElementById("nameAlert").innerHTML = "";
  }

  if (!phoneNumber || !phoneNumberRegex.test(phoneNumber)) {
    document.getElementById("phoneAlert").innerHTML =
      "Please enter a valid phone number.";
    isValid = false;
  } else {
    document.getElementById("phoneAlert").innerHTML = "";
  }

  if (!email || !emailRegex.test(email)) {
    document.getElementById("emailAlert").innerHTML =
      "Please enter a valid email.";
    isValid = false;
  } else {
    document.getElementById("emailAlert").innerHTML = "";
  }

  if (!password || !passwordRegex.test(password)) {
    document.getElementById("passwordAlert").innerHTML =
      "Password must be at least 4 characters long and include at least one letter and one number.";
    isValid = false;
  } else {
    document.getElementById("passwordAlert").innerHTML = "";
  }

  if (password !== confirmPassword) {
    document.getElementById("confirmPasswordAlert").innerHTML =
      "Passwords do not match.";
    isValid = false;
  } else {
    document.getElementById("confirmPasswordAlert").innerHTML = "";
  }

  if (isValid) {
    // api call to submit the data to server using fetch

    const inputData = {
      name: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
    };
    const body = JSON.stringify(inputData);

    fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }).then(response => response.json())
    .then(data => {
        console.log(data)
        if (data.status === 'success' && data.redirectUrl) {
            localStorage.removeItem("otpStartTime");
            window.location.replace(data.redirectUrl);
        }else{
            alert(data.message)
        }
    })
    .catch(error => {
        console.error("Error", error)
        alert("Somthing went wrong")
    })

  }
});
