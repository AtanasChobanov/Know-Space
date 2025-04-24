import File from "./fileModel.js";
import db from "../config/db.js";
import { fetchWikipediaImages } from "../config/wikipedia.js";

class PostFilesManager {
  constructor(postId) {
    this.postId = postId;
    this.uploadedFiles = [];
  }

  async addFiles(files) {
    try {
      await Promise.all(files.map((file) => File.addFile(this.postId, file.url, file.type)));
    } catch (err) {
      console.error("Error uploading files to Cloudinary:", err);
      throw err;
    }
  }

  async deleteFiles(fileIds) {
    try {
      await this.getFiles();

      if (!Array.isArray(fileIds)) {
        fileIds = [fileIds];
      }
      // Convert all elements to numbers
      fileIds = fileIds.map((id) => parseInt(id, 10));
      const filesToDelete = this.uploadedFiles.filter(file => 
        fileIds.includes(file.fileId)
      );
      await Promise.all(
        filesToDelete.map((file) => file.deleteFromCloudinary())
      );

      await db.query(`DELETE FROM post_files WHERE file_id = ANY($1::int[])`, [
        fileIds,
      ]);
    } catch (err) {
      console.error("Error deleting selected files:", err);
      throw err;
    }
  }

  // DELETE all files for a specific post from Cloudinary
  async deleteAllFiles() {
    try {
      await this.getFiles();
      await Promise.all(this.uploadedFiles.map((file) => file.deleteFromCloudinary()));
    } catch (err) {
      console.error("Error deleting files from Cloudinary:", err);
      throw err;
    }
  }

  // READ all files for a specific post
  async getFiles() {
    try {
      const result = await db.query(
        `SELECT * FROM post_files WHERE post_id = $1;`,
        [this.postId]
      );
      this.uploadedFiles = result.rows.map(
        (file) =>
          new File(
            file.file_id,
            file.post_id,
            file.url,
            file.type,
            file.upload_date
          )
      );
    } catch (err) {
      console.error("Error fetching files for post:", err);
      throw err;
    }
  }

  // Get up to 5 images from Wikipedia API
  async getWikipediaImages(pageTitle) {
    try {
      const validImages = await fetchWikipediaImages(pageTitle);
      this.uploadedFiles = validImages.map(
        (image) => new File("wiki", this.postId, image, "image", new Date())
      );
    } catch (err) {
      console.error("Error fetching Wikipedia images:", err);
      return [];
    }
  }
}

export default PostFilesManager;