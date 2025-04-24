import db from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

class File {
  constructor(fileId, postId, url, type, uploadDate) {
    this.fileId = fileId;
    this.postId = postId;
    this.url = url;
    this.type = type;
    this.uploadDate = uploadDate;
  }

  #extractPublicId() {
    const urlParts = this.url.split("/");
    let fileName = urlParts.pop();
    if (this.type === "image") {
      fileName = fileName.split(".")[0]; // the special name of file without extension for images
    }
    const folderPath = urlParts.slice(urlParts.indexOf("upload") + 2).join("/");
    return `${folderPath}/${fileName}`;
  }

  // Функция за изтриване на файл
  async deleteFromCloudinary() {
    try {
      const result = await cloudinary.uploader.destroy(this.#extractPublicId(), { resource_type: this.type === "document" ? "raw" : "image" });
      console.log("File deleted from Cloudinary:", result);
      return result;
    } catch (err) {
      console.error("Error deleting file from Cloudinary:", err);
      throw err;
    }
  }

  static async addFile(postId, fileUrl, fileType) {
    try {
      const result = await db.query(
        `INSERT INTO post_files (post_id, url, type) 
                VALUES ($1, $2, $3)
                RETURNING *;`,
        [postId, fileUrl, fileType]
      );
      const newFile = result.rows[0];
      return new File(
        newFile.file_id,
        newFile.post_id,
        newFile.url,
        newFile.type,
        newFile.upload_date
      );
    } catch (err) {
      console.error("Error adding file:", err);
      throw err;
    }
  }
}

export default File;