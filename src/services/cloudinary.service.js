import cloudinary from "cloudinary";
import streamifier from "streamifier";
import { config } from "../config/env.config.js";

cloudinary.v2.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export const uploadAvatar = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "avatars" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const uploadToCloudinary = async (fileBuffer, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const uploadLessonHtml = async (htmlBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "lessons",
        resource_type: "raw",
        format: "html",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(htmlBuffer).pipe(stream);
  });
};