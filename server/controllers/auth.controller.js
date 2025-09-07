import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail  from "../middleware/email.config.js";


export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: "Please provide an email" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
let verificationCode = Math.floor(1000 + Math.random() * 9000);

    await sendEmail(email, verificationCode);


    user.verificationCode = verificationCode;
    await user.save();


    return res.status(200).json({ msg: "Verification code sent" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
}

export const verifyEmail = async (req, res) => {
 try {
  const { verificationCode } = req.body;
  
  const user = await User.findOne({ verificationCode });
  if (!user) {
    return res.status(400).json({ msg: "Invalid verification code" });
  }
  user.isVerified = true;
  user.verificationCode = null; 
  await user.save();

  return res.status(200).json({ msg: "Email verified successfully" });
 } catch (error) {
  return res.status(500).json({ msg: "Server error" });
 }
}


export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ msg: "User already exists" });
    }
let verificationCode = Math.floor(1000 + Math.random() * 9000);


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await sendEmail(email, verificationCode);
  

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verificationCode,
    });

    await newUser.save();

    return res.status(201).json({ msg: "User registered successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};



export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials (user not found)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials (wrong password)" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: "Email not verified. Please verify your email." });
    }

    const payload = {
      id: user._id,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    return res.status(200).json({ token, user: payload });

  } catch (err) {
    console.error("Error during login:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
};



export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ msg: "Please provide email and new password" });
  }
  try{
    const user= await User.findOne({email});
    if(!user){
      return res.status(400).json({ msg: "User not found" });
    }
    const salt= await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(newPassword,salt);
    user.password= hashedPassword;
    await user.save();
    return res.status(200).json({ msg: "Password reset successful" });
  }catch(err){
    console.error("Error during password reset:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
}