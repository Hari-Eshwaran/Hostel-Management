import { body, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// Strong password validation helper
const strongPassword = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number")
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage("Password must contain at least one special character");

// Register validation
export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone is required").matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
  strongPassword,
  body("organizationalCode").optional().trim().notEmpty().withMessage("Organizational code cannot be empty if provided"),
];

// Login validation
export const loginRules = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Add Tenant validation
export const addTenantRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").optional().matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
  body("aadharNumber").optional().matches(/^\d{12}$/).withMessage("Aadhaar must be 12 digits"),
  body("securityDeposit").optional().isNumeric().withMessage("Security deposit must be a number"),
];

// Add Payment validation
export const addPaymentRules = [
  body("tenant").notEmpty().withMessage("Tenant is required").isMongoId().withMessage("Invalid tenant ID"),
  body("amount").isNumeric().withMessage("Amount must be a number").custom(v => v > 0).withMessage("Amount must be positive"),
  body("method").optional().isIn(["cash", "card", "online", "bank_transfer", "check"]).withMessage("Invalid payment method"),
  body("status").optional().isIn(["pending", "completed", "failed", "refunded"]).withMessage("Invalid status"),
  body("type").optional().isIn(["rent", "deposit", "maintenance", "other"]).withMessage("Invalid type"),
];

// Add Room validation
export const addRoomRules = [
  body("number").trim().notEmpty().withMessage("Room number is required"),
  body("rent").isNumeric().withMessage("Rent must be a number").custom(v => v > 0).withMessage("Rent must be positive"),
  body("type").optional().isIn(["single", "double", "shared"]).withMessage("Invalid room type"),
  body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
];

// Add Ticket validation
export const addTicketRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).withMessage("Title too long"),
  body("description").optional().isLength({ max: 2000 }).withMessage("Description too long"),
  body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("category").optional().isIn(["technical", "payment", "maintenance", "complaint", "security", "plumbing", "other"]).withMessage("Invalid category"),
];

// Forgot Password validation
export const forgotPasswordRules = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
];

// Reset Password validation
export const resetPasswordRules = [
  body("token").notEmpty().withMessage("Reset token is required"),
  strongPassword,
];

// Tenant onboarding validation
export const onboardTenantRules = [
  body("aadharNumber").optional().matches(/^\d{12}$/).withMessage("Aadhaar must be 12 digits"),
  body("room").notEmpty().withMessage("Room selection is required").isMongoId().withMessage("Invalid room ID"),
  body("moveInDate").notEmpty().withMessage("Move-in date is required").isISO8601().withMessage("Invalid date format"),
  body("securityDeposit").optional().isNumeric().withMessage("Security deposit must be a number"),
  body("gender").optional().isIn(["male", "female", "other"]).withMessage("Invalid gender"),
  body("termsAccepted").optional().isBoolean().withMessage("Terms acceptance must be boolean"),
  body("bloodGroup").optional().isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).withMessage("Invalid blood group"),
];
