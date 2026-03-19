import { CustomSelect } from "@/shared/components/CustomSelect";
import { DashboardMonth } from "@/modules/sessions/hooks/useSessionsDashboard";

interface SessionsMonthSelectorProps {
  months: DashboardMonth[];
  selectedMonth: number | null;
  onChange: (value: number) => void;
}

export function SessionsMonthSelector({
  months,
  selectedMonth,
  onChange,
}: SessionsMonthSelectorProps) {
  return (
    <CustomSelect
      label="Chọn kỳ quản lý"
      value={selectedMonth}
      onChange={onChange}
      options={months.map((month) => ({
        value: month.id,
        label: new Date(month.month_year).toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        }),
        sublabel: month.status === "open" ? "Đang mở" : "Đã đóng",
      }))}
      className="max-w-md"
    />
  );
}
