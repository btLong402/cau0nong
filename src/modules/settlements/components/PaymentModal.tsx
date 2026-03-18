'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { SettlementListItem, useSettlementVietQR } from '@/shared/hooks';

interface PaymentModalProps {
  isOpen: boolean;
  settlement: SettlementListItem | null;
  processing: boolean;
  onClose: () => void;
  onConfirm: (settlement: SettlementListItem) => Promise<void>;
  formatCurrency: (value: number) => string;
}

export function PaymentModal({
  isOpen,
  settlement,
  processing,
  onClose,
  onConfirm,
  formatCurrency,
}: PaymentModalProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrImageError, setQrImageError] = useState<string | null>(null);
  const [qrImageLoading, setQrImageLoading] = useState(false);

  const settlementId = settlement?.id || null;
  const { vietqr, loading, error, refetch } = useSettlementVietQR(settlementId, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && !processing) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, processing]);

  useEffect(() => {
    if (!isOpen) {
      setCopyMessage(null);
      setActionError(null);
      setQrImageUrl(null);
      setQrImageError(null);
      setQrImageLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    async function generateQrImage(content: string) {
      setQrImageLoading(true);
      setQrImageError(null);

      try {
        const imageDataUrl = await QRCode.toDataURL(content, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrImageUrl(imageDataUrl);
      } catch {
        setQrImageUrl(null);
        setQrImageError('Không thể render ảnh QR từ nội dung hiện tại.');
      } finally {
        setQrImageLoading(false);
      }
    }

    const content = vietqr?.payment.qr_content;
    if (!isOpen || !content) {
      setQrImageUrl(null);
      setQrImageError(null);
      setQrImageLoading(false);
      return;
    }

    void generateQrImage(content);
  }, [isOpen, vietqr?.payment.qr_content]);

  const breakdown = useMemo(() => {
    if (!settlement) {
      return null;
    }

    return [
      { label: 'Tiền sân', value: settlement.court_fee },
      { label: 'Tiền cầu', value: settlement.shuttlecock_fee },
      { label: 'Nợ cũ', value: settlement.past_debt },
      { label: 'Số dư trừ', value: -Math.abs(settlement.balance_carried) },
    ];
  }, [settlement]);

  if (!isOpen || !settlement) {
    return null;
  }

  async function handleConfirm() {
    setActionError(null);

    if (!settlement) {
      return;
    }

    try {
      await onConfirm(settlement);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác nhận thanh toán';
      setActionError(message);
    }
  }

  async function handleCopyContent() {
    if (!vietqr?.payment.qr_content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(vietqr.payment.qr_content);
      setCopyMessage('Đã sao chép nội dung VietQR');
    } catch {
      setCopyMessage('Không thể sao chép, vui lòng sao chép thủ công');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 p-3 md:items-center md:p-6">
      <div className="surface-card w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Thanh toán & VietQR</h3>
            <p className="mt-1 text-sm text-slate-600">
              {settlement.user_name || 'Thành viên'} • {settlement.user_email || settlement.user_id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="btn-secondary min-h-0 rounded-md px-3 py-1.5 text-xs disabled:opacity-60"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-4 p-5">
          <section className="surface-card-soft p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">Chi tiết quyết toán</h4>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
              {breakdown?.map((item) => (
                <p key={item.label} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
              <span className="font-medium text-blue-900">Tổng cần đóng</span>
              <span className="text-base font-bold text-blue-900">{formatCurrency(settlement.total_due)}</span>
            </p>
          </section>

          <section className="surface-card-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">VietQR</h4>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={loading}
                className="btn-secondary min-h-0 rounded-md px-3 py-1.5 text-xs disabled:opacity-60"
              >
                {loading ? 'Đang tạo...' : 'Tạo lại'}
              </button>
            </div>

            {loading ? (
              <div className="mt-3 rounded-md bg-white px-3 py-4 text-sm text-slate-600">Đang tạo dữ liệu VietQR...</div>
            ) : error ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                {error.message}
              </div>
            ) : vietqr ? (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="rounded-md bg-white px-3 py-4">
                  {qrImageLoading ? (
                    <p className="text-sm text-slate-600">Đang dựng ảnh QR để quét...</p>
                  ) : qrImageError ? (
                    <p className="text-sm text-red-700">{qrImageError}</p>
                  ) : qrImageUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={qrImageUrl}
                        alt="Mã QR thanh toán"
                        className="h-[220px] w-[220px] rounded-lg border border-slate-200 bg-white p-2"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Chưa có ảnh QR để hiển thị.</p>
                  )}
                </div>
                <p className="rounded-md bg-white px-3 py-2">
                  Nội dung CK: <span className="font-medium text-slate-900">{vietqr.payload.addInfo}</span>
                </p>
                <p className="rounded-md bg-white px-3 py-2">
                  Số tiền QR: <span className="font-medium text-slate-900">{formatCurrency(vietqr.payload.amount)}</span>
                </p>
                <p className="break-all rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  {vietqr.payment.qr_content}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="btn-secondary min-h-0 rounded-md px-3 py-1.5 text-xs"
                  >
                    Sao chép nội dung QR
                  </button>
                  {copyMessage && <span className="text-xs text-emerald-700">{copyMessage}</span>}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md bg-white px-3 py-4 text-sm text-slate-600">Chưa có dữ liệu VietQR.</div>
            )}
          </section>

          {(actionError || settlement.is_paid) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {actionError || 'Quyết toán này đã được xác nhận thanh toán.'}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="btn-secondary"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || settlement.is_paid}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? 'Đang xác nhận...' : 'Xác nhận đã thu'}
          </button>
        </div>
      </div>
    </div>
  );
}
