import AIStudio from "@/components/AIStudio";

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

async function getTask(taskId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function TaskDetailsPage({ params }: PageProps) {
  const { taskId } = await params;

  const task = await getTask(taskId);

  if (!task) {
    return <div className="p-6">Task not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{task.title}</h1>

        <p className="text-gray-500 mt-2">{task.description}</p>

        <p className="mt-3 text-sm capitalize">
          Status: {task.status.replace("_", " ")}
        </p>

        {task.feedback_note && (
          <div className="mt-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl p-4">
            <p className="text-sm font-medium text-yellow-500">
              Admin Feedback
            </p>

            <p className="mt-2 text-gray-300">{task.feedback_note}</p>
          </div>
        )}
      </div>

      <AIStudio
        taskId={task.id}
        productImage={task.product_image_url}
        taskStatus={task.status}
      />
    </div>
  );
}
