// ✅ আপনার server.js এর সাথে মিল রেখে সঠিক API লিংক
const api = "http://localhost:3000/api/products";

// ================= ADD PRODUCT (WITH IMAGE UPLOAD) =================
function addProduct() {
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const imageInput = document.getElementById("image");

  const name = nameInput.value;
  const price = priceInput.value;
  const image = imageInput.files[0];

  // সব ফিল্ড পূরণ করা হয়েছে কি না চেক
  if (!name || !price || !image) {
    alert("সব ফিল্ড পূরণ করো এবং একটি ছবি সিলেক্ট করো!");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", Number(price));
  formData.append("image", image); // server.js এর upload.single("image") এর সাথে মিল আছে

  console.log("Uploading product...");

  fetch(api, {
    method: "POST",
    body: formData
    // নোট: FormData ব্যবহার করলে headers এ Content-Type দেওয়া লাগে না
  })
  .then(res => {
    // যদি সার্ভার থেকে ভুল রেসপন্স আসে (যেমন HTML), তবে এখানে ধরা পড়বে
    if (!res.ok) {
        throw new Error("Server error! Status: " + res.status);
    }
    return res.json();
  })
  .then(data => {
    console.log("Success:", data);
    alert("Product added successfully!");
    
    // ইনপুট বক্সগুলো খালি করা
    nameInput.value = "";
    priceInput.value = "";
    imageInput.value = "";
    
    loadProducts(); // নতুন লিস্ট লোড করা
  })
  .catch(err => {
    console.error("UPLOAD ERROR:", err);
    alert("Upload failed! আপনার টার্মিনালে দেখুন সার্ভার চলছে কি না।");
  });
}

// ================= DELETE PRODUCT =================
function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  fetch(`${api}/${id}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  })
  .then(data => {
    alert("Product deleted!");
    loadProducts();
  })
  .catch(err => {
    console.error("Delete Error:", err);
    alert("ডিলিট করতে সমস্যা হয়েছে।");
  });
}

// ================= LOAD PRODUCTS =================
function loadProducts() {
  fetch(api)
    .then(res => {
        if (!res.ok) throw new Error("Load failed");
        return res.json();
    })
    .then(products => {
      const container = document.getElementById("list");
      if (!container) return; // যদি list id না থাকে তবে কাজ করবে না
      
      container.innerHTML = "";

      if (products.length === 0) {
        container.innerHTML = "<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>";
        return;
      }

      products.forEach(p => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ddd";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";
        div.style.borderRadius = "8px";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "space-between";

        div.innerHTML = `
          <div style="display:flex; align-items:center;">
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/100?text=No+Image'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; margin-right:15px;">
            <div>
                <h3 style="margin:0;">${p.name || "No Name"}</h3>
                <p style="margin:5px 0;">${p.price || 0} BDT</p>
            </div>
          </div>
          <button onclick="deleteProduct('${p._id}')" style="background:red; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">Delete</button>
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Load Error:", err);
      const container = document.getElementById("list");
      if (container) container.innerHTML = "<p style='color:red;'>প্রোডাক্ট লোড করা যাচ্ছে না। সার্ভার চেক করুন।</p>";
    });
}

// ================= AUTO LOAD =================
loadProducts();