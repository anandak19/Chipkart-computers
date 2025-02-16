const productsTableBody = document.getElementById('productsTableBody');

function generateProductRow(product, index) {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <img 
            src="${product.images && product.images.length > 0 && product.images[0].filepath ? product.images[0].filepath : '/images/default/default.jpg'}" 
            alt="${product.productName}" 
            style="width: 100px; height: auto"
          />
        </td>
        <td>${product.productName}</td>
        <td>${product.categoryDetails?.categoryName || 'N/A'}</td>
        <td>${product.brand}</td>
        <td>${product.mrp}</td>
        <td>${product.discount}</td>
        <td>${product.finalPrice}</td>
        <td>${product.quantity}</td>
        <td>${product.isFeatured ? 'Yes' : 'No'}</td>
        <td>${product.isListed ? 'Yes' : 'No'}</td>
        <td>
            <button class="btn ${product.isListed ? 'btn-danger' : 'btn-success'} btn-sm toggleBtn" data-id="${product._id}">
              ${product.isListed ? 'Unlist' : 'List'}
            </button>
          <a href="/admin/products/edit/${product._id}" class="btn btn-primary btn-sm mt-2">Edit</a>
        </td>
      </tr>
    `;
}

// Method to show products in the table
const showProducts = (productsArray) => {
    console.log(productsArray);
    if (productsArray.length > 0) {
        productsTableBody.innerHTML = productsArray.map(generateProductRow).join("");
    } else {
        productsTableBody.innerHTML = `<tr><td colspan="12" class="text-center">No products found</td></tr>`;
    }

    document.querySelectorAll('.toggleBtn').forEach((btn) => {
        btn.addEventListener('click', () => {
            alert('clik')
        })
    })
};

// method to call products in db 
let page = 0
let hasMore = false
const getAllProducts = async() => {
    try {
        const url = `/admin/products/all?page=${page}`

        const res = await fetch(url)

        const data = await res.json()

        if (res.ok) {
            showProducts(data.productsArray)
        }else{
            alert(data.error || "Somthing went wrong")
        }

    } catch (error) {
        console.error(error);
        alert("Error fetching products")
    }
}

// dom load method 
// document.addEventListener('DOMContentLoaded', () => {
//     getAllProducts()
// })

// --------------------------- 

// method to search a proudct 

// method to next page 

// method to previous page 