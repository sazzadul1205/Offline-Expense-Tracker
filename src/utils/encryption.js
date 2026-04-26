// src/utils/encryption.js
import CryptoJS from "crypto-js";

const SECRET_KEY = "expense-tracker-secret-key-v1"; // In production, use a more secure key

// Encrypt data
export const encryptData = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
};

// Decrypt data
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Encrypt sensitive database fields
export const encryptSensitiveField = (value) => {
  if (!value) return value;
  return encryptData(value);
};

// Decrypt sensitive database fields
export const decryptSensitiveField = (encryptedValue) => {
  if (!encryptedValue) return encryptedValue;
  return decryptData(encryptedValue);
};
