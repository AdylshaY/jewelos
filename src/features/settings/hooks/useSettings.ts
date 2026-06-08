import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useSettings() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleBackup = async () => {
    clearMessages();
    setBackupLoading(true);
    try {
      const path = await invoke<string>('backup_database');
      setSuccessMessage(`Veritabanı başarıyla yedeklendi:\n${path}`);
    } catch (err: any) {
      if (err !== 'Backup cancelled') {
        setErrorMessage(err?.toString() || 'Yedekleme sırasında bir hata oluştu.');
      }
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    clearMessages();
    setRestoreLoading(true);
    try {
      const path = await invoke<string>('restore_database');
      setSuccessMessage(`Yedek başarıyla yüklendi:\n${path}\n\nUygulama yenileniyor...`);
      
      // Reload the app after a brief delay so the user can read the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      if (err !== 'Restore cancelled') {
        setErrorMessage(err?.toString() || 'Geri yükleme sırasında bir hata oluştu.');
      }
      setRestoreLoading(false);
    }
  };

  return {
    backupLoading,
    restoreLoading,
    successMessage,
    errorMessage,
    clearMessages,
    handleBackup,
    handleRestore,
  };
}
