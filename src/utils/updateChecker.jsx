// src/utils/updateChecker.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { APP_VERSION, isNewerVersion } from '../version';

// URL to your version.json file in GitHub
const UPDATE_URL = "https://raw.githubusercontent.com/sazzadul1205/Offline-Expense-Tracker/master/updates/version.json";

export const checkForUpdates = async (showManualToast = false) => {
  try {
    const response = await fetch(UPDATE_URL);

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

    if (isNewerVersion(latest.version) && latest.updateAvailable) {
      const featuresHtml = latest.changes.map(change =>
        `<li style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
          <span style="color: #3b82f6; font-weight: bold;">✓</span>
          <span style="color: #374151;">${change}</span>
        </li>`
      ).join('');

      const versionCompareHtml = `
        <div style="display: flex; justify-content: center; gap: 20px; margin: 15px 0;">
          <div style="text-align: center;">
            <span style="font-size: 0.8em; color: #6b7280;">Current</span>
            <div style="font-size: 1.2em; font-weight: bold; color: #374151;">v${APP_VERSION}</div>
          </div>
          <div style="font-size: 1.5em; color: #9ca3af;">→</div>
          <div style="text-align: center;">
            <span style="font-size: 0.8em; color: #6b7280;">New</span>
            <div style="font-size: 1.2em; font-weight: bold; color: #3b82f6;">v${latest.version}</div>
          </div>
        </div>
      `;

      const result = await Swal.fire({
        title: '✨ Update Available!',
        html: `
          <div style="text-align: left;">
            ${versionCompareHtml}
            <p style="color: #6b7280; margin-bottom: 15px; font-size: 0.9em; text-align: center;">
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
          Swal.fire({
            title: 'Download Started!',
            text: 'Your update is now downloading.',
            icon: 'success',
            confirmButtonColor: '#3b82f6'
          });
          window.open(latest.downloadUrl, '_blank');
        }
      }
      return true;
    } else {
      if (showManualToast) {
        await Swal.fire({
          title: 'No Updates Available',
          text: `You're running the latest version (${APP_VERSION})`,
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
        setTimeout(async () => {
          await checkForUpdates(false);
          setHasChecked(true);
        }, 3000);
      }
    };
    checkOnStart();
  }, [hasChecked]);
};