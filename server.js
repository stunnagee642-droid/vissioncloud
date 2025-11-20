import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => res.redirect("/login.html"));

// Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send("Missing fields!");

  const exist = await User.findOne({ username });
  if (exist) return res.send("Username exists!");

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed });

  res.redirect("/login.html");
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send("Missing fields!");

  const user = await User.findOne({ username });
  if (!user) return res.send("User not found!");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password!");

  res.redirect(`/home.html?user=${username}`);
});

// File Upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.send("No file uploaded!");
  res.redirect("/home.html");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
