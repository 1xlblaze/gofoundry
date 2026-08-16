type Status =
  | "done"
  | "todo"
  | "starred"
  | "free"
  | "pro"
  | "in-progress"
  | "quiz"
  | "staff";

const STATUS_CLASS: Record<Status, string> = {
  done: "ds-status-done",
  todo: "ds-status-todo",
  starred: "ds-status-starred",
  free: "ds-status-free",
  pro: "ds-status-pro",
  "in-progress": "ds-status-progress",
  quiz: "ds-status-quiz",
  staff: "ds-status-staff",
};

const STATUS_LABEL: Record<Status, string> = {
  done: "Done",
  todo: "Todo",
  starred: "Starred",
  free: "Free",
  pro: "Pro",
  "in-progress": "In progress",
  quiz: "Quiz",
  staff: "Staff-grade",
};

export function StatusChip({
  status,
  label,
  className = "",
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`ds-chip ds-status ${STATUS_CLASS[status]} ${className}`.trim()}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
