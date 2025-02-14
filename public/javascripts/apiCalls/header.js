const cartCount = document.getElementById('cartCount')

const getCartCount = async() => {
    try {
        const response = await fetch('/cart/count')
        const data = await response.json()
        if (response.ok) {
            cartCount.innerText = data.count
        }
    } catch (error) {
        cartCount.innerText = 0
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getCartCount()
})