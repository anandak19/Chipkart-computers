const orderTable = document.getElementById('orderTable')
const searchForm = document.querySelector('.search-form')
const prevBtn = document.querySelector('.prev-btn')
const nextBtn = document.querySelector('.next-btn')

let page = 0;
let search = ""; 


const showorders = (orders, totalorders) => {
  orderTable.innerHTML = "";
  if (orders.length > 0 || totalorders > 0) {
    console.log(orders);
    orders.forEach((order, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}</td>
            <td>${order.items.length}</td>
            <td>${order.totalPayable}</td>
            <td>${order.paymentStatus}</td>
            <td>${order.paymentMethod}</td>
            <td>
            ${
              order.isCancelled ? '<span class="text-danger"><strong>Cancelled</strong></span>'
              : `
              <select onchange="updateOrderStatus(this.value, '${order._id}')">
                  <option value="Ordered" ${order.orderStatus === 'Ordered' ? 'selected' : ''}>Ordered</option>
                  <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
              `
            }
            </td>
            <td><a href="/admin/orders/all/${order._id}">View Order</a></td>
        `;
      orderTable.appendChild(row);
    });

  } else {
    const row = document.createElement("tr");
    row.innerHTML = `No orders found`;
    orderTable.appendChild(row);
    console.log("no Orders found");
  }
};

function updateOrderStatus(status, orderId) {
    fetch("/admin/orders/update-status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            toastr.success("Order status updated successfully!");
        } else {
            toastr.error(data.message || "Failed to update order status");
        }
    })
    .catch(error => {
        console.error("Error updating order status:", error);
        alert("Something went wrong. Please try again.");
    });
}

// update paginators
const updatePaginators = (hasMore) => {
    prevBtn.disabled = page === 0;
    nextBtn.disabled = !hasMore
  };

const getOrders = async (page = 0, search = "") => {
  try {
    let url = `/admin/orders/all?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let data;
    try {
      data = await response.json();
      console.log(data)
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      alert("Invalid response from the server");
      return;
    }

    const { hasMore, totalorders, orders} = data;

    if (response.ok) {
      showorders(orders, totalorders);
      updatePaginators(hasMore);
    } else {
      alert(message);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

document.addEventListener("DOMContentLoaded", getOrders);


prevBtn.addEventListener('click', () => {
  page--
  getOrders(page)
})

nextBtn.addEventListener('click', () => {
  page++
  getOrders(page)
})

// working 
// searchForm.addEventListener('submit', (e) => {
//     e.preventDefault()
//     const errorMessage = document.getElementById('errorMessage')
//     const searchInput = document.getElementById('searchQuery');
//     const search = searchInput.value.trim();
//     errorMessage.innerText = ''
//     let isValid = true
  
//     if(!search){
//       isValid = false
//       errorMessage.innerText = 'Enter Order Id'
//     }
  
//     if (isValid) {
//       getOrders(0, search)
//     }

//   })