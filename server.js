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
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Static folder for images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MONGO DB CONNECT =================
// আপনার ডাটাবেজ কানেকশন স্ট্রিং একদম ঠিক আছে
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
  oldPrice: Number,
  description: String,
  images: [String],
  externalUrl: String
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

// ২. নতুন প্রোডাক্ট অ্যাড করা
app.post("/api/products", upload.array("images", 3), async (req, res) => {
  try {
    const onlineUrl = req.protocol + '://' + req.get('host'); // এটি অটোমেটিক রেন্ডার লিঙ্ক নিয়ে নিবে
    
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
      images: imagePaths
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

// ৪. নতুন অর্ডার সেভ করা (এখানেই 404 আসছিল)
app.post("/api/orders", async (req, res) => {
  try {
    console.log("New Order Received:", req.body); // সার্ভার লগে অর্ডার চেক করার জন্য
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(200).json({ message: "Order placed successfully" });
  } catch (err) {
    console.error("Order Save Error:", err.message);
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
const PORT = process.env.PORT || 10000; // Render সাধারণত 10000 পোর্ট ব্যবহার করে
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
