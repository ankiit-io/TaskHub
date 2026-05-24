"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import StatusBadge from "@/components/StatusBadge";

import {
  AlertTriangle,
  Search,
  Trash2,
  Pencil,
  Upload,
  X,
  Filter,
} from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tasks, setTasks] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [assignedTo, setAssignedTo] = useState("");

  const [remark, setRemark] = useState("");

  const [image, setImage] = useState<File | null>(null);

  const [preview, setPreview] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    initialize();
  }, [session, status]);

  async function initialize() {
    await Promise.all([fetchTasks(), fetchUsers()]);

    setLoading(false);
  }

  async function fetchTasks() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
      );

      const data = await response.json();

      setTasks(data.tasks || []);
    } catch (error) {
      console.log(error);

      toast.error("Failed to fetch tasks");
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
      );

      const data = await response.json();

      setUsers(data.users || []);
    } catch (error) {
      console.log(error);
    }
  }

  function resetForm() {
    setTitle("");

    setDescription("");

    setAssignedTo("");

    setRemark("");

    setImage(null);

    setPreview("");

    setEditingTaskId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(file?: File | null) {
    if (!file) return;

    setImage(file);

    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);

    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadImage() {
    if (!image) return "";

    const fileName = `${Date.now()}-${image.name}`;

    const { error } = await supabase.storage
      .from("task-image")
      .upload(fileName, image);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("task-image").getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function createTask() {
    try {
      if (!title || !description || !assignedTo) {
        toast.error("Please fill all required fields");

        return;
      }

      setCreating(true);

      const imageUrl = await uploadImage();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            description,
            assigned_to: assignedTo,
            product_image_url: imageUrl,
            feedback_note: remark,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      resetForm();

      fetchTasks();
    } catch (error) {
      console.log(error);

      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  async function updateTask() {
    try {
      if (!editingTaskId) return;

      setCreating(true);

      let imageUrl = "";

      if (image) {
        imageUrl = await uploadImage();
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${editingTaskId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            description,
            assigned_to: assignedTo,
            feedback_note: remark,
            ...(imageUrl && {
              product_image_url: imageUrl,
            }),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      resetForm();

      fetchTasks();
    } catch (error) {
      console.log(error);

      toast.error("Failed to update task");
    } finally {
      setCreating(false);
    }
  }

  async function deleteTask(taskId: string) {
    setSelectedTaskId(taskId);

    setDeleteModal(true);
  }

  async function confirmDeleteTask() {
    try {
      setTasks((prev) => prev.filter((task) => task.id !== selectedTaskId));

      setDeleteModal(false);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${selectedTaskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setSelectedTaskId("");
    } catch (error) {
      console.log(error);

      toast.error("Failed to delete task");

      fetchTasks();
    }
  }

  function openEdit(task: any) {
    if (task.status !== "assigned") {
      toast.error("Only assigned tasks can be edited");

      return;
    }

    setEditingTaskId(task.id);

    setTitle(task.title);

    setDescription(task.description);

    setAssignedTo(task.assigned_to);

    setRemark(task.feedback_note || "");

    setPreview(task.product_image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-10 w-72 bg-white/10 rounded-2xl"></div>

            <div className="h-4 w-48 bg-white/10 rounded-xl"></div>
          </div>

          <div className="flex gap-3">
            <div className="h-11 w-64 bg-white/10 rounded-xl"></div>

            <div className="h-11 w-40 bg-white/10 rounded-xl"></div>
          </div>
        </div>

        <div className="h-[420px] rounded-3xl bg-white/5 border border-white/10"></div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-3xl overflow-hidden border border-white/10 bg-white/5"
            >
              <div className="h-60 bg-white/10"></div>

              <div className="p-6 space-y-4">
                <div className="h-7 w-52 bg-white/10 rounded-xl"></div>

                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded-lg"></div>

                  <div className="h-4 w-[80%] bg-white/10 rounded-lg"></div>
                </div>

                <div className="flex gap-3">
                  <div className="h-11 w-11 bg-white/10 rounded-xl"></div>

                  <div className="h-11 w-11 bg-white/10 rounded-xl"></div>

                  <div className="h-11 w-32 bg-white/10 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>

          <p className="text-gray-400 mt-2">Manage AI workflows and reviews.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
              className="pl-10 bg-white/5 border border-white/10 rounded-xl h-11 w-64 outline-none px-4"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-500" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 bg-[#0F0F10] text-white border border-white/10 rounded-xl h-11 pr-10 outline-none appearance-none hover:border-white/20 transition-all"
              style={{
                colorScheme: "dark",
              }}
            >
              <option className="bg-[#0F0F10] text-white" value="all">
                All
              </option>

              <option className="bg-[#0F0F10] text-white" value="assigned">
                Assigned
              </option>

              <option className="bg-[#0F0F10] text-white" value="in_progress">
                In Progress
                </option>

              <option className="bg-[#0F0F10] text-white" value="submitted">
                Submitted
              </option>

              <option className="bg-[#0F0F10] text-white" value="accepted">
                Accepted
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-white/5 rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">
            {editingTaskId ? "Edit Task" : "Create Task"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="w-full min-h-[160px] bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Admin remark"
              className="w-full min-h-[100px] bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[#0F0F10] text-white border border-white/10 rounded-2xl p-4 outline-none hover:border-white/20 transition-all"
              style={{
                colorScheme: "dark",
              }}
            >
              <option className="bg-[#0F0F10] text-white" value="">
                Select User
              </option>

              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-[#0F0F10] text-white"
                >
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-3xl min-h-[320px] cursor-pointer overflow-hidden relative flex items-center justify-center"
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-[320px] object-cover"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      removeImage();
                    }}
                    className="absolute top-4 right-4 bg-black/80 p-2 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>

                  <div>
                    <p className="font-medium text-lg">Upload Product Image</p>

                    <p className="text-gray-400 text-sm mt-2">
                      Click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>

        <button
          disabled={creating}
          onClick={editingTaskId ? updateTask : createTask}
          className="bg-white text-black hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-2xl font-medium"
        >
          {creating
            ? "Processing..."
            : editingTaskId
              ? "Update Task"
              : "Create Task"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTasks.map((task) => (
          <Link href={`/admin/tasks/${task.id}`} key={task.id}>
            <div className="border border-white/10 bg-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all cursor-pointer">
              {task.product_image_url && (
                <img
                  src={task.product_image_url}
                  alt={task.title}
                  className="w-full h-60 object-cover"
                />
              )}

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{task.title}</h2>

                    <p className="text-gray-400 mt-2 line-clamp-3">
                      {task.description}
                    </p>
                  </div>

                  <StatusBadge status={task.status} />
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {task.assigned_user?.avatar ? (
                      <img
                        src={task.assigned_user.avatar}
                        alt="avatar"
                        className="h-14 w-14 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-semibold border border-white/10">
                        {task.assigned_user?.name?.charAt(0) || "U"}
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-400">Assigned To</p>

                      <p className="font-medium text-lg">
                        {task.assigned_user?.name || "Unknown User"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Progress</p>

                    <p className="font-medium">
                      {Math.min(
                        Math.round(((task.generated_count || 0) / 8) * 100),
                        100,
                      )}
                      %
                    </p>
                  </div>
                </div>

                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((task.generated_count || 0) / 8) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex gap-3 flex-wrap">
                  {task.status === "assigned" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();

                        e.stopPropagation();

                        openEdit(task);
                      }}
                      className="h-11 w-11 rounded-xl border border-white/10 hover:bg-white/10 flex items-center justify-center"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.preventDefault();

                      e.stopPropagation();

                      deleteTask(task.id);
                    }}
                    className="h-11 w-11 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {task.feedback_note && (
                  <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-2xl p-4">
                    <p className="text-yellow-400 font-medium text-sm">
                      Admin Remark
                    </p>

                    <p className="mt-2 text-sm text-gray-300">
                      {task.feedback_note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md border border-white/10 bg-[#0B0B0B] rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Delete Task</h2>

                <p className="text-sm text-gray-400 mt-1">
                  This will permanently delete the task and all generated
                  images.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModal(false);

                  setSelectedTaskId("");
                }}
                className="h-11 px-5 rounded-xl border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteTask}
                className="h-11 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
