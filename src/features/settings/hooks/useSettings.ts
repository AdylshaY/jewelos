import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useSettings() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const checkPinStatus = async () => {
    try {
      const isSet = await invoke<boolean>('is_admin_pin_set');
      setIsPinSet(isSet);
    } catch (err) {
      console.error('Failed to check PIN status:', err);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const completed = await invoke<boolean>('is_onboarding_completed');
      setIsOnboardingCompleted(completed);
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      await invoke('complete_onboarding');
      setIsOnboardingCompleted(true);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  };

  useEffect(() => {
    checkPinStatus();
    checkOnboardingStatus();
  }, []);

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

  const handleResetDatabase = async () => {
    clearMessages();
    setResetLoading(true);
    try {
      await invoke('dev_reset_database');
      setSuccessMessage('Veritabanı başarıyla sıfırlandı.\n\nUygulama yeniden yükleniyor...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.toString() || 'Veritabanı sıfırlanırken bir hata oluştu.');
      setResetLoading(false);
    }
  };

  const handleSetPin = async (newPin: string, currentPin?: string): Promise<string | null> => {
    clearMessages();
    setPinLoading(true);
    try {
      const recoveryKey = await invoke<string | null>('set_admin_pin', { currentPin: currentPin || null, newPin });
      setSuccessMessage(
        isPinSet 
          ? 'Yönetici PIN kodu başarıyla güncellendi.' 
          : 'Yönetici PIN kodu başarıyla oluşturuldu.'
      );
      await checkPinStatus();
      return recoveryKey;
    } catch (err: any) {
      setErrorMessage(err?.toString() || 'PIN kodu kaydedilirken bir hata oluştu.');
      throw err;
    } finally {
      setPinLoading(false);
    }
  };

  const handleRemovePin = async (currentPin: string) => {
    clearMessages();
    setPinLoading(true);
    try {
      await invoke('remove_admin_pin', { currentPin });
      setSuccessMessage('Yönetici PIN kodu koruması başarıyla kaldırıldı.');
      await checkPinStatus();
    } catch (err: any) {
      setErrorMessage(err?.toString() || 'PIN kodu kaldırılırken bir hata oluştu.');
      throw err;
    } finally {
      setPinLoading(false);
    }
  };

  return {
    backupLoading,
    restoreLoading,
    resetLoading,
    pinLoading,
    isPinSet,
    isOnboardingCompleted,
    successMessage,
    errorMessage,
    clearMessages,
    handleBackup,
    handleRestore,
    handleResetDatabase,
    handleSetPin,
    handleRemovePin,
    handleCompleteOnboarding,
    checkPinStatus,
  };
}
