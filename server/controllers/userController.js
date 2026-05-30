import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//Register User : /api/user/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true, // ngăn không cho javascript truy cập token
      secure: process.env.NODE_ENV === "production", // sử dụng bảo mật https khi deploy lên internet
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // bảo mật CSRF cho phép gửi cookie từ một domain khác(tab khác)
      maxAge: 7 * 24 * 60 * 60 * 1000, // Thời gian tồn tại
    });

    return res.json({
      success: true,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Login User: api/user/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({
        success: false,
        message: "Email and password are required",
      });

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true, // ngăn không cho javascript truy cập token
      secure: process.env.NODE_ENV === "production", // sử dụng bảo mật https khi deploy lên internet
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // bảo mật CSRF cho phép gửi cookie từ một domain khác(tab khác)
      maxAge: 7 * 24 * 60 * 60 * 1000, // Thời gian tồn tại
    });

    return res.json({
      success: true,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Check Auth: /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const { userId } = req;
    // dấu - ở select là chỉ lấy các thông tin user mà không lấy password(nếu không lấy thêm email thì -email hoặc bỏ dấu trừ để chỉ lấy những cái mình muốn)
    const user = await User.findById(userId).select("-password");
    return res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Logout User : /api/user/logout
export const logout = async (req, res) => {
  try {
    //cần truyền các option như lúc set vì để browser hiểu đúng là cookie đó, nếu thiếu thì sẽ tưởng cookie khác
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
