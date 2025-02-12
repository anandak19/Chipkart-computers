const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhone = document.getElementById("userPhone");
// address
const reciver = document.getElementById("reciver");
const phone = document.getElementById("phone");
const addressField = document.getElementById("address");
const landmark = document.getElementById("landmark");

const orderItemTable = document.getElementById('orderItemTable')

// method to get items details
const showOrderInfo = (user, address) => {
  userName.innerText = user.name;
  userEmail.innerText = user.email;
  userPhone.innerText = user.phoneNumber;
  // address
  reciver.innerText = address.fullName;
  phone.innerText = address.phoneNumber;
  const formattedAddress = `${address.addressLine}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`;
  addressField.innerText = formattedAddress;
  landmark.innerText = address.landmark || "Nil";
};

// method to get user info and address
const getAddressUserInfo = async () => {
  try {
    const response = await fetch("/admin/orders/info");
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const { address, user } = data;
      showOrderInfo(user, address);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};


// show orderd items 
const showOrderItems = (orderDetails) => {
    orderItemTable.innerHTML = "";
    if (orderDetails.length > 0) {
    orderDetails.forEach((item, index) => {
        const row = document.createElement("tr");
  
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${item.image[0].filepath}" alt="Product-image"></td>
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
        `;
        orderItemTable.appendChild(row);
      });
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `No users found`;
      orderItemTable.appendChild(row);
    }
};

// method to get the orderd items
const getOrderItems = async () => {
  try {
    const response = await fetch("/admin/orders/items");
    const data = await response.json();
    if (response.ok) {
        console.log(data)
        showOrderItems(data.items)
    }else{
        console.log(data)
    }
  } catch (error) {
    alert("Somthing went wrong")
    console.error(error)
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAddressUserInfo();
  getOrderItems();
});

// cancel order 
const cancelOrderBtn = document.querySelector('.cancel-order-btn')
const cancelReason = document.getElementById('cancelReason')
cancelOrderBtn.addEventListener('click', async() =>{
    const reason = cancelReason.value.trim()
    if (!reason) {
        toastr.error("You must provide a valid reason");
        return
    } 

    try {
      const response = await fetch('/admin/orders/cancel/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({cancelReason: reason})
      })

      const data = await response.json()
      if (response.ok) {
        toastr.success(data.message || "Order cancelled")
        setTimeout(() => {
          location.reload()
        } , 2000)
      }else{
        toastr.error(data.error || "Somthing went wrong")
      }

    } catch (error) {
      console.error(error);
      alert("somthing went wrong")
    }
})


const backButton = document.querySelector('.back-btn');
if (backButton) {
  backButton.addEventListener('click', () => {
    window.location.href = '/admin/orders';
  });
}










