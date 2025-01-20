const nameRegex = /^[a-zA-Z ]{1,20}$/;

document.querySelector(".search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  let isValid = true;
  const error = document.getElementById("errorMessage");
  const search = document.getElementById("query").value;
  if (search.trim().length < 1) {
    isValid = false;
    error.innerText = "Enter the name of user";
  }else if(!nameRegex.test(search.trim())){
      isValid = false;
      error.innerText = "Enter a valid name";
  }

  if (isValid) {
    e.target.submit();
  }
});
