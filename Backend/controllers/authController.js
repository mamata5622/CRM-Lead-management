
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================
// GENERATE JWT TOKEN
// =====================================
const generateToken = (user) => {
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.EXPIRESIN || "2h",
    }
  );
};

// =====================================
// SAFE USER RESPONSE
// Never return password or password hash
// =====================================
const userResponse = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

// =====================================
// REGISTER USER
// POST /api/auth/register
// =====================================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate name length
    if (normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // bcrypt supports a maximum of 72 UTF-8 bytes
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 72 bytes",
      });
    }

    // Check whether email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Public registration must never create an admin
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse(user),
    });
  } catch (error) {
    // Handle duplicate email race conditions
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

// =====================================
// LOGIN USER
// POST /api/auth/login
// =====================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate required fields
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select password if excluded by the model
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // Use a generic message to avoid revealing whether
    // an email address is registered
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Block inactive accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact an administrator.",
      });
    }

    // Compare submitted password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token after successful authentication
    const token = generateToken(user);

    // Redirect based on the role stored in MongoDB
    const role = String(user.role || "user").trim().toLowerCase();

    const roleRoutes = {
      admin: "/admin/dashboard",
      employee: "/employee/dashboard",
      user: "/dashboard",
    };

    const redirectTo = roleRoutes[role];

    if (!redirectTo) {
      return res.status(403).json({
        success: false,
        message: "Your account role is not recognized. Contact an administrator.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      expiresIn: process.env.EXPIRESIN || "2h",
      user: userResponse(user),
      redirectTo,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================
module.exports = {
  register,
  login,
};
