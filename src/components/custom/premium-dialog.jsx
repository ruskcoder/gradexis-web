import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function PremiumDialog({ open, onOpenChange, onCancel, showCancel = false }) {
  const navigate = useNavigate()

  const handleOpenSettings = () => {
    onOpenChange(false)
    navigate('/settings')
  }

  const handleCancel = () => {
    onOpenChange(false)
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onEscapeKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Referrals Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to gain referrals to access this feature.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleOpenSettings}>
            Open Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
