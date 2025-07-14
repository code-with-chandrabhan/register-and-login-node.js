import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import session from "express-session";
import { v2 as cloudinary } from "cloudinary";

// Fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session setup
app.use(session({
  secret: "supersecretkey123",  
  resave: false,
  saveUninitialized: true,
}));

// Cloudinary config
cloudinary.config({
  cloud_name: "dngpsrt5w",
  api_key: "514621175814957",
  api_secret: "71WLy8Ey_7WvMT3cbM806zcxlz8",
});

// MongoDB Connection
mongoose.connect("mongodb+srv://chandrabhan8708295629:nXPwfZRKRZAJZAjm@cluster0.rf251kl.mongodb.net/", {
  dbName: "login_data",
})
.then(() => console.log("Database connected"))
.catch((err) => console.log(err));

// Mongoose Schema
const usersSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  filename: String,
  public_id: String,
  imgurl: String,
});
const Users = mongoose.model("cloudinary", usersSchema);

// Multer config
const storage = multer.diskStorage({
  destination: path.join(__dirname, "public/uploads"),
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage });

// ROUTES

// GET Login Page
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/profile");
  res.render("login", { error: null });
});

// GET Register Page
app.get("/register", (req, res) => {
  res.render("register");
});

// POST Register Handler
app.post("/register", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const { name, email, password } = req.body;

    const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
      folder: "nodejs_filesuploader",
    });

    await Users.create({
      name,
      email,
      password,
      filename: req.file.filename,
      public_id: cloudinaryResponse.public_id,
      imgurl: cloudinaryResponse.secure_url,
    });

    res.redirect("/");
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).send("Error during registration");
  }
});

// POST Login Handler
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ email });

    if (!user || user.password !== password) {
      return res.render("login", { error: "Invalid credentials" });
    }

    req.session.user = user; 
    res.redirect("/profile");
  } catch (err) {
    console.log("Login error", err);
    res.status(500).send("Internal server error");
  }
});

// GET Profile Page (Protected)
app.get("/profile", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.render("profile", { user: req.session.user });
});

// GET Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log("Logout error:", err);
    res.redirect("/");
  });
});

// Start server
app.listen(3000, () => {
  console.log("server is listening on port 3000");
});
