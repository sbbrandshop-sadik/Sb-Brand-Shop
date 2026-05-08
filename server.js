const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ================= UPLOADS FOLDER CHECK =================
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Static folder for images
app.use("/uploads", express.static("uploads"));

// ================= MONGO DB CONNECT =================
mongoose.connect("mongodb+srv://Admin:sadik88007@cluster0.1rhiqfe.mongodb.net/sbbrandshop")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.error("DB Connection Error:", err));

// ================= MULTER (MULTI-IMAGE UPLOAD) =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ================= MODELS =================
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  oldPrice: Number,      // নতুন: ডিসকাউন্টের জন্য
  description: String,   // নতুন: প্রোডাক্ট বর্ণনা
  images: [String],      // নতুন: ৩টি ছবির জন্য অ্যারে
  externalUrl: String    // নতুন: বাইরের লিঙ্ক থেকে ছবি
});
const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
  customerName: String,
  phoneNumber: String,
  address: String,
  pantInfo: String,
  shirtInfo: String,
  shoeInfo: String,
  items: Array,
  totalAmount: Number,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// ================= ROUTES (API) =================

// ১. সব প্রোডাক্ট দেখা
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. নতুন প্রোডাক্ট অ্যাড করা (Update for Multi-Image)
// এখানে upload.array("images", 3) ব্যবহার করা হয়েছে ৩টি ছবির জন্য
app.post("/api/products", upload.array("images", 3), async (req, res) => {
  try {
    const onlineUrl = "https://sb-brand-shop.onrender.com";
    
    // আপলোড করা ফাইলগুলোর লিঙ্ক তৈরি করা
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => `${onlineUrl}/uploads/${file.filename}`);
    }

    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      oldPrice: req.body.oldPrice,
      description: req.body.description,
      externalUrl: req.body.externalUrl,
      images: imagePaths // ৩টি ছবির লিঙ্ক অ্যারে হিসেবে থাকবে
    });
    
    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৩. প্রোডাক্ট ডিলিট করা
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    // সার্ভার থেকে ছবিগুলো মুছে ফেলার কোড (Optional)
    if (product && product.images) {
        product.images.forEach(imgLink => {
            const fileName = imgLink.split("/").pop();
            const filePath = path.join(__dirname, "uploads", fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৪. নতুন অর্ডার সেভ করা
app.post("/api/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(200).json({ message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৫. সব অর্ডার দেখা
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৬. অর্ডার ডিলিট করা
app.delete("/api/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
