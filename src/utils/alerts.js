// src/utils/alerts.js
import Swal from "sweetalert2";

// Success Alert
export const showSuccessAlert = (title, message, timer = 2000) => {
  return Swal.fire({
    title: title || "Success!",
    text: message,
    icon: "success",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "OK",
    timer: timer,
    timerProgressBar: true,
  });
};

// Error Alert
export const showErrorAlert = (title, message) => {
  return Swal.fire({
    title: title || "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "OK",
  });
};

// Warning Alert
export const showWarningAlert = (title, message) => {
  return Swal.fire({
    title: title || "Warning!",
    text: message,
    icon: "warning",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "OK",
  });
};

// Info Alert
export const showInfoAlert = (title, message) => {
  return Swal.fire({
    title: title || "Information",
    text: message,
    icon: "info",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "OK",
  });
};

// Confirm Alert
export const showConfirmAlert = async (
  title,
  message,
  confirmText = "Yes",
  cancelText = "No",
) => {
  const result = await Swal.fire({
    title: title || "Are you sure?",
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#ef4444",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
};

// Toast Notification
export const showToast = (message, icon = "success", duration = 3000) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
  Toast.fire({
    icon: icon,
    title: message,
  });
};

// Loading Alert
export const showLoadingAlert = (title, message) => {
  return Swal.fire({
    title: title || "Processing...",
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close Loading Alert
export const closeLoadingAlert = () => {
  Swal.close();
};

// Form Validation Alert
export const showValidationAlert = (message) => {
  return Swal.fire({
    title: "Validation Error",
    text: message,
    icon: "warning",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "OK",
  });
};
