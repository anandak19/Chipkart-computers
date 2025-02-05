async function addToCart(id) {
    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({productId: id})
        })

        const data = await response.json()
        if (response.ok) {
            alert(data.message)
        }else{
            alert(data.error)
        }
        
    } catch (error) {
        console.error("Error", error);
        alert("Somthing went wrong")
    }
}