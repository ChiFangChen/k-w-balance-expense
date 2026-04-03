import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  const [secondConfirm, setSecondConfirm] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!secondConfirm) {
      setSecondConfirm(true)
      return
    }
    setSecondConfirm(false)
    onConfirm()
  }

  const handleCancel = () => {
    setSecondConfirm(false)
    onCancel()
  }

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">
          {secondConfirm ? (
            <>
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: 'var(--color-warning)', marginRight: '0.5rem' }} />
              再次確認，此操作無法復原！
            </>
          ) : message}
        </p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {secondConfirm ? '確定執行' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
