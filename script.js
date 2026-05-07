const container = document.getElementById("products");

function loadProducts() {
  container.innerHTML = "";

  fetch("http://localhost:3000/products")
    .then(res => res.json())
    .then(products => {
      products.forEach(p => {
        const div = document.createElement("div");

        div.innerHTML = `
          <h3>${p.name}</h3>
          <p>${p.price} BDT</p>
          <button onclick="addToCart('${p.name}', ${p.price})">
            Add to Cart
          </button>
        `;

        container.appendChild(div);
      });
    });
}

loadProducts();

// auto refresh every 5 sec
setInterval(loadProducts, 5000);

function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}