import { CheckCircle2, Clock3, Loader2, RotateCcw } from "lucide-react";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const statusMap: Record<
    string,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  > = {
    assigned: {
      label: "Assigned",
      className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",

      icon: <Clock3 className="h-4 w-4" />,
    },

    in_progress: {
      label: "In Progress",
      className: "bg-blue-500/15 text-blue-400 border-blue-500/20",

      icon: <Loader2 className="h-4 w-4" />,
    },

    submitted: {
      label: "Submitted",
      className: "bg-purple-500/15 text-purple-400 border-purple-500/20",

      icon: <CheckCircle2 className="h-4 w-4" />,
    },

    accepted: {
      label: "Accepted",
      className: "bg-green-500/15 text-green-400 border-green-500/20",

      icon: <CheckCircle2 className="h-4 w-4" />,
    },

    revision_requested: {
      label: "Revision Requested",
      className: "bg-red-500/15 text-red-400 border-red-500/20",

      icon: <RotateCcw className="h-4 w-4" />,
    },
  };

  const current = statusMap[status] || statusMap.assigned;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${current.className}`}
    >
      {current.icon}

      {current.label}
    </div>
  );
}
