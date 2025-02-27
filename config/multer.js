import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "images") {
          cb(null, "public/uploads/images/");
        } else if (file.fieldname === "documents") {
          cb(null, "public/uploads/documents/");
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

    // When uploading an image
    if (file.fieldname === "images"  && allowedImageTypes.test(extname)) {
        return cb(null, true);
    }

    // When uploading a document
    if (file.fieldname === "documents"  && allowedDocTypes.test(extname)) {
        return cb(null, true);
    }

    // If the file type is not supported
    cb(new Error("Невалиден тип файл."));
};

// Multer configuration
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Maximum 5 MB per file
    },
    fileFilter,
});

export const uploadFiles = upload.fields([
    { name: "images", maxCount: 5 }, // Maximum 5 images
    { name: "documents", maxCount: 1 }, // Maximum 1 document
]);
