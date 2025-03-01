const wishlistItems = document.querySelector('.wishlist-items-container');
console.log(wishlistItems)
// method to show the items in wishlist 
const showWishlistedItems = (items) => {
    wishlistItems.innerHTML = ''
    if (items.length > 0) {
        // show 
        items.forEach(p => {
            const itemCard = document.createElement('div')
            itemCard.classList.add('wishlist-item')
            console.log(p)
            itemCard.innerHTML = `
                <div class="item-details">
    
                    <div class="item-image">
                      <img src="${p.images[0].filepath}" alt="" />
                    </div>
    
                    <div class="item-data">
                      <h3>${p.productName}</h3>
                      <p class="price">${p.finalPrice}</p>
                    </div>    
                    
                    </div>   
                    <div class="actions-btns">
                        <button onClick="addToCart('${p.productId}')">Add to Cart</button>
                        <button onClick="removeWishlistItem('${p.productId}')">Remove Item</button>
                    </div>
            `
            wishlistItems.appendChild(itemCard)
            
        });
    }else{
        wishlistItems.innerHTML = '<p class="text-center">No items added till now</p>'
    }
}

async function removeWishlistItem(id) {
    const url = `/products/wishlist/add/${id}`
    try {
      const res = await fetch(url, {
        method: 'POST'
      })
  
      const result = await res.json() 
      if (res.ok) {
        console.log(result)
        location.reload();
      }else{
        alert(result.error)
      }
    } catch (error) {
      console.error(error);
      alert('Error adding to wishlist')
    }
  }


// method to get the wishlisted items 
const getWishlistItems = async() => {
    try {
        const res = await fetch('/account/wishlist/all')
        const result = await res.json()
        if (res.ok) {
            showWishlistedItems(result.products)
        }else{
            alert(result.error)
        }
        
    } catch (error) {
        console.error(error);
        alert("Somthing went wrong")
    }
}

// on dom loaded call 
document.addEventListener('DOMContentLoaded', getWishlistItems)