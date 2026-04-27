// src/components/UpdateChecker.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

// Current version of your app
const CURRENT_VERSION = "4.0.0";

// URL to your version.json file in GitHub
const UPDATE_URL = "https://raw.githubusercontent.com/sazzadul1205/Offline-Expense-Tracker/master/updates/version.json";

export const checkForUpdates = async (showManualToast = false) => {
  try {
    const response = await fetch(UPDATE_URL);

    // If no internet or file not found
    if (!response.ok) {
      if (showManualToast) {
        await Swal.fire({
          title: 'Check Failed',
          text: 'Unable to check for updates. Please check your internet connection.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      }
      return false;
    }

    const latest = await response.json();

    // Compare versions
    if (latest.version !== CURRENT_VERSION && latest.updateAvailable) {
      // Build the features list HTML
      const featuresHtml = latest.changes.map(change =>
        `<li style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
          <span style="color: #3b82f6; font-weight: bold;">✓</span>
          <span style="color: #374151;">${change}</span>
        </li>`
      ).join('');

      // First dialog - Ask if user wants to update
      const result = await Swal.fire({
        title: '✨ Update Available!',
        html: `
          <div style="text-align: left;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">
              <strong>Version ${latest.version}</strong> is now available
            </p>
            <p style="color: #6b7280; margin-bottom: 15px; font-size: 0.9em;">
              📅 Released: ${latest.releaseDate}
            </p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 12px; margin: 15px 0;">
              <strong style="display: block; margin-bottom: 12px; font-size: 1em; color: #1f2937;">🎯 What's New:</strong>
              <ul style="margin: 0; padding-left: 0; list-style: none;">
                ${featuresHtml}
              </ul>
            </div>
            <div style="background: #eef2ff; padding: 12px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #1e40af; font-size: 0.85em; margin: 0;">
                ⚠️ <strong>Important:</strong> After downloading, you'll need to manually install the APK file.
                Your existing data will be preserved.
              </p>
            </div>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '📥 Download Update',
        cancelButtonText: '⏰ Remind Me Later',
        backdrop: true,
        allowOutsideClick: false
      });

      if (result.isConfirmed) {
        // Second dialog - Final confirmation before download
        const confirmDownload = await Swal.fire({
          title: 'Start Download?',
          html: `
            <p>You are about to download version <strong>${latest.version}</strong></p>
            <p style="font-size: 0.9em; color: #6b7280; margin-top: 10px;">
              File size: ~5-10 MB<br>
              Download will start immediately.
            </p>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#22c55e',
          cancelButtonColor: '#6b7280',
          confirmButtonText: '✅ Yes, Download Now',
          cancelButtonText: 'No, Cancel'
        });

        if (confirmDownload.isConfirmed) {
          // Show downloading with progress simulation
          let progress = 0;
          const downloadModal = Swal.fire({
            title: 'Downloading Update...',
            html: `
              <div style="text-align: center;">
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 8px; margin: 20px 0; overflow: hidden;">
                  <div id="download-progress" style="width: 0%; background: #3b82f6; height: 100%; transition: width 0.3s ease;"></div>
                </div>
                <p id="download-status" style="color: #6b7280; font-size: 0.9em;">Preparing download...</p>
                <p style="color: #9ca3af; font-size: 0.8em; margin-top: 15px;">Please wait while we prepare your update</p>
              </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              let progress = 0;

              const progressBar = document.getElementById('download-progress');
              const statusText = document.getElementById('download-status');

              const interval = setInterval(() => {
                progress += 10;

                if (progressBar) {
                  progressBar.style.width = `${Math.min(progress, 90)}%`;
                }

                if (statusText) {
                  if (progress < 30) statusText.textContent = 'Connecting to server...';
                  else if (progress < 60) statusText.textContent = 'Preparing update package...';
                  else if (progress < 90) statusText.textContent = 'Almost ready...';
                  else statusText.textContent = 'Starting download...';
                }

                if (progress >= 100) {
                  clearInterval(interval);
                }
              }, 200);

              setTimeout(() => {
                clearInterval(interval);

                if (progressBar) {
                  progressBar.style.width = '100%';
                }

                setTimeout(() => {
                  window.open(latest.downloadUrl, '_blank');
                  Swal.close();

                  Swal.fire({
                    title: 'Download Started!',
                    text: 'Your update is now downloading.',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                  });
                }, 500);
              }, 2000);
            }
          });
        }
      }

      return true;
    } else {
      if (showManualToast) {
        await Swal.fire({
          title: 'No Updates Available',
          text: `You're running the latest version (${CURRENT_VERSION})`,
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          showConfirmButton: false
        });
      }
      return false;
    }
  } catch (error) {
    console.error('Update check failed:', error);
    if (showManualToast) {
      await Swal.fire({
        title: 'Check Failed',
        text: 'Unable to check for updates. Please check your internet connection.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
    return false;
  }
};

// Auto-check on app start
export const useAutoUpdateCheck = () => {
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkOnStart = async () => {
      if (!hasChecked) {
        // Wait 3 seconds after app loads
        setTimeout(async () => {
          await checkForUpdates(false);
          setHasChecked(true);
        }, 3000);
      }
    };

    checkOnStart();
  }, [hasChecked]);
};