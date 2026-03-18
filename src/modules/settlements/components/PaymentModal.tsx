'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { SettlementListItem, useSettlementVietQR, useAuth } from '@/shared/hooks';

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
  const { user: authUser } = useAuth();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrImageError, setQrImageError] = useState<string | null>(null);
  const [qrImageLoading, setQrImageLoading] = useState(false);

  const settlementId = settlement?.id || null;
  const { vietqr, loading, error, refetch } = useSettlementVietQR(settlementId, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && !processing) onClose();
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
    if (!settlement) return null;

    return [
      { label: 'Tiền sân', value: settlement.court_fee },
      { label: 'Tiền cầu', value: settlement.shuttlecock_fee },
      { label: 'Nợ cũ', value: settlement.past_debt },
      { label: 'Số dư trừ', value: -Math.abs(settlement.balance_carried) },
    ];
  }, [settlement]);

  if (!isOpen || !settlement) return null;

  async function handleConfirm() {
    setActionError(null);
    if (!settlement) return;

    try {
      await onConfirm(settlement);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác nhận thanh toán';
      setActionError(message);
    }
  }

  async function handleCopyContent() {
    if (!vietqr?.payment.qr_content) return;

    try {
      await navigator.clipboard.writeText(vietqr.payment.qr_content);
      setCopyMessage('Đã sao chép nội dung VietQR');
    } catch {
      setCopyMessage('Không thể sao chép, vui lòng sao chép thủ công');
    }
  }

  return (
    <div className="drawer-overlay flex items-end justify-center p-3 md:items-center md:p-6">
      <div className="surface-card w-full max-w-2xl overflow-hidden" style={{ animation: 'slide-up 250ms ease' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--surface-border)] px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">Thanh toán & VietQR</h3>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {settlement.user_name || 'Thành viên'} • {settlement.user_email || settlement.user_id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="btn-ghost min-h-0 px-3 py-1.5 text-xs disabled:opacity-60"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
          {/* Breakdown */}
          <section className="surface-card-soft p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Chi tiết quyết toán</h4>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {breakdown?.map((item) => (
                <p key={item.label} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
                  <span className="text-[var(--muted)]">{item.label}</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatCurrency(item.value)}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-between rounded-lg border border-[var(--primary-muted)] bg-[var(--primary-soft)] px-3 py-2.5 text-sm">
              <span className="font-medium text-[var(--primary-hover)]">Tổng cần đóng</span>
              <span className="text-base font-bold text-[var(--primary-hover)]">{formatCurrency(settlement.total_due)}</span>
            </p>
          </section>

          {/* VietQR */}
          <section className="surface-card-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">VietQR</h4>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={loading}
                className="btn-ghost min-h-0 px-3 py-1.5 text-xs disabled:opacity-60"
              >
                {loading ? 'Đang tạo...' : 'Tạo lại'}
              </button>
            </div>

            {loading ? (
              <div className="mt-3 skeleton h-[220px] w-[220px] mx-auto" />
            ) : error ? (
              <div className="mt-3 p-3 border-l-4 border-l-[var(--danger)] text-sm text-[var(--danger)]">
                {error.message}
              </div>
            ) : vietqr ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-md bg-white p-4">
                  {qrImageLoading ? (
                    <div className="skeleton h-[220px] w-[220px] mx-auto" />
                  ) : qrImageError ? (
                    <p className="text-sm text-[var(--danger)]">{qrImageError}</p>
                  ) : qrImageUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={qrImageUrl}
                        alt="Mã QR thanh toán"
                        className="h-[220px] w-[220px] rounded-lg border border-[var(--surface-border)] bg-white p-2"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">Chưa có ảnh QR để hiển thị.</p>
                  )}
                </div>
                <p className="rounded-md bg-white px-3 py-2 text-[var(--muted)]">
                  Nội dung CK: <span className="font-medium text-[var(--foreground)]">{vietqr.payload.addInfo}</span>
                </p>
                <p className="rounded-md bg-white px-3 py-2 text-[var(--muted)]">
                  Số tiền QR: <span className="font-medium text-[var(--foreground)]">{formatCurrency(vietqr.payload.amount)}</span>
                </p>
                <p className="break-all rounded-md bg-[var(--surface-hover)] px-3 py-2 text-xs text-[var(--muted)]">
                  {vietqr.payment.qr_content}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="btn-secondary min-h-0 px-3 py-1.5 text-xs"
                  >
                    Sao chép nội dung QR
                  </button>
                  {copyMessage && <span className="text-xs text-[var(--accent)]">{copyMessage}</span>}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md bg-white px-3 py-4 text-sm text-[var(--muted)]">Chưa có dữ liệu VietQR.</div>
            )}
          </section>

          {(actionError || settlement.is_paid) && (
            <div className="rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
              {actionError || 'Quyết toán này đã được xác nhận thanh toán.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--surface-border)] px-5 py-4 md:flex-row md:justify-end">
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
            disabled={processing || settlement.is_paid || authUser?.role !== 'admin'}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? 'Đang xác nhận...' : authUser?.role !== 'admin' ? 'Chỉ Admin được xác nhận' : 'Xác nhận đã thu'}
          </button>
        </div>
      </div>
    </div>
  );
}
