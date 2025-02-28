toastr.options = {
    positionClass: "toast-top-center",
    timeOut: 3000,
    showMethod: "slideDown",
    hideMethod: "fadeOut"
};


async function addToCart(id) {
    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({productId: id})
        })
 
        const data = await response.json()
        if (response.ok) {
            toastr.success(data.message);
            getCartCount()
        }else{
            toastr.info(data.error);
            if (data.redirect) {
                setTimeout(() => {
                    window.location = '/login'
                }, 1000)
            }
        }
        
    } catch (error) {
        console.error("Error", error);
        alert("Somthing went wrong")
        if (data.redirect) {
            window.location = '/login'
        }
    }

}
