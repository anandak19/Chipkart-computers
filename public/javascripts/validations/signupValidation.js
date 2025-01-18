const fullNameRegex = /^[a-zA-Z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;

// document.querySelector("form").addEventListener('submit', (e) => {
//     e.preventDefault();

//     const fullName = document.getElementById("name").value.trim();
//     const phoneNumber = document.getElementById("phoneNumber").value.trim();
//     const email = document.getElementById("email").value.trim();
//     const password = document.getElementById("password").value;
//     const confirmPassword = document.getElementById("confirmPassword").value;

//     let isValid = true;

//     if (!fullName || fullName.length < 3 || fullName.length > 20 || !fullNameRegex.test(fullName)) {
//         document.getElementById('nameAlert').innerHTML = 'Please enter a valid name (3-20 characters, no numbers or special characters).';
//         isValid = false;
//     } else {
//         document.getElementById('nameAlert').innerHTML = '';
//     }

//     if (!phoneNumber || !phoneNumberRegex.test(phoneNumber)) {
//         document.getElementById('phoneAlert').innerHTML = 'Please enter a valid phone number.';
//         isValid = false;
//     } else {
//         document.getElementById('phoneAlert').innerHTML = '';
//     }

//     if (!email || !emailRegex.test(email)) {
//         document.getElementById('emailAlert').innerHTML = 'Please enter a valid email.';
//         isValid = false;
//     } else {
//         document.getElementById('emailAlert').innerHTML = '';
//     }

//     if (!password || !passwordRegex.test(password)) {
//         document.getElementById('passwordAlert').innerHTML = 'Password must be at least 4 characters long and include at least one letter and one number.';
//         isValid = false;
//     } else {
//         document.getElementById('passwordAlert').innerHTML = '';
//     }

//     if (password !== confirmPassword) {
//         document.getElementById('confirmPasswordAlert').innerHTML = 'Passwords do not match.';
//         isValid = false;
//     } else {
//         document.getElementById('confirmPasswordAlert').innerHTML = '';
//     }

//     if (isValid) {
//         console.log({
//             fullName,
//             phoneNumber,
//             email,
//             password
//         });
//         e.target.submit();
//     }
// });


// Timer settings
const timerElement = document.getElementById("timer");
const resendOtpBtn = document.getElementById("resendOtpBtn");
let timeLeft = 60;


// Countdown function
const countdown = setInterval(() => {
  if (timeLeft > 0) {
    timeLeft--;
    timerElement.textContent = timeLeft;
  } else {
    clearInterval(countdown);
    timerElement.textContent = "expired";
    timerElement.style.color = "red";
    document.querySelectorAll(".otp-box").forEach((box) => (box.disabled = true)); 
  }
}, 1000);

// OTP Box input navigation
const otpBoxes = document.querySelectorAll(".otp-box");

otpBoxes.forEach((box, index) => {
  box.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < otpBoxes.length - 1) {
      otpBoxes[index + 1].focus(); 
    } else if (e.target.value.length === 1 && index === otpBoxes.length - 1) {
      box.blur();
    } else if (e.inputType === "deleteContentBackward" && index > 0) {
      otpBoxes[index - 1].focus();
    }
  });
});




