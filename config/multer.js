import multer from "multer";
import path from "path";
import fs from "fs/promises";
import cloudinary from "./cloudinary.js";

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "images") {
          cb(null, "public/uploads/images/");
        } else if (file.fieldname === "documents") {
          cb(null, "public/uploads/documents/");
        } else if (file.fieldname === "profile-pictures") {
          cb(null, "public/uploads/profile-pictures/");
        } else if (file.fieldname === "channel-banners") {
          cb(null, "public/uploads/channel-banners/");
        }
    }, 
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// File type and size limitations
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png/;
    const allowedDocTypes = /pdf|docx|pptx|xlsx|txt/;
    const extname = path.extname(file.originalname).toLowerCase();

    if ((file.fieldname === "images" || file.fieldname === "profile-pictures" || file.fieldname === "channel-banners") && allowedImageTypes.test(extname)) {
        return cb(null, true);
    }
    if (file.fieldname === "documents" && allowedDocTypes.test(extname)) {
        return cb(null, true);
    }
    cb(new Error("Unsupported file type!"));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maximum 5MB per file
    fileFilter,
});

function errorHandler(err, res) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).render("error-message", { errorMessage: "Файлът е твърде голям. Максимум 5MB." });
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).render("error-message", { errorMessage: "Не може да се качват повече от 5 снимки." });
      } else {
        return res.status(400).render("error-message", { errorMessage: "Грешка при качването на файла." });
      }
    } else if (err.message === "Unsupported file type!") {
      return res.status(400).render("error-message", { errorMessage: "Неподдържан тип файл." });
    } else {
      console.error(err);
      return res.status(500).render("error-message", { errorMessage: "Неочаквана грешка." });
    }
}

export const uploadFiles = async (req, res, next) => {
    upload.fields([
        { name: "images", maxCount: 5 },
        { name: "documents", maxCount: 1 },
        { name: "profile-pictures", maxCount: 1 },
        { name: "channel-banners", maxCount: 1 },
    ])(req, res, async (err) => {
        if (err) {
            errorHandler(err, res);
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return next();
        }

        req.uploadedFiles = [];
        for (const fieldname in req.files) {
            for (const file of req.files[fieldname]) {
                let uploadOptions = { folder: `uploads/${fieldname}` };
                if (fieldname === "documents") {
                    uploadOptions.resource_type = "raw"; 
                }

                try {
                    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
                    // Change file type to singular
                    const fileType = fieldname.slice(0, -1);
                    req.uploadedFiles.push({ url: result.secure_url, type: fileType });
                    await fs.unlink(file.path);
                } catch (error) {
                    console.error("Error uploading file to Cloudinary:", error);
                    return res.status(500).render("error-message", { errorMessage: "Cloudinary upload failed" });
                }
            }
        }
        next();
    });
};
