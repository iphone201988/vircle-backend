import multer, { FileFilterCallback } from "multer";
import fs from "fs";
import path from "path";



const uploadDir = path.join(__dirname, "../../uploads");


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  
    if (!allowedExts.includes(ext)) {
      return cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed!"),file.fieldname);
    }
  
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});


const upload = multer({ storage });
export default upload;
