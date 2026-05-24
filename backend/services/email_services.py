import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

FRONTEND_URL = os.getenv("FRONTEND_URL")


def send_task_assigned_email(user_email, user_name, task_title, task_id):

    resend.Emails.send({
        "from": "TaskHub <onboarding@resend.dev>",
        "to": [user_email],
        "subject": f"New Task Assigned: {task_title}",
        "html": f"""
        <div style="font-family: Arial; padding: 20px;">
            <h2>New Task Assigned</h2>

            <p>Hello {user_name},</p>

            <p>You have been assigned a new task.</p>

            <p>
                <strong>Task:</strong> {task_title}
            </p>

            <a
                href="{FRONTEND_URL}/dashboard/{task_id}"
                style="
                    background: black;
                    color: white;
                    padding: 10px 16px;
                    text-decoration: none;
                    border-radius: 6px;
                    display: inline-block;
                    margin-top: 10px;
                "
            >
                Open Task
            </a>
        </div>
        """
    })


def send_task_submitted_email(admin_email, task_title, user_name, task_id):

    resend.Emails.send({
        "from": "TaskHub <onboarding@resend.dev>",
        "to": [admin_email],
        "subject": f"Task Completed: {task_title} by {user_name}",
        "html": f"""
        <div style="font-family: Arial; padding: 20px;">
            <h2>Task Submitted</h2>

            <p>
                <strong>{user_name}</strong>
                submitted the task:
            </p>

            <p>
                <strong>{task_title}</strong>
            </p>

            <a
                href="{FRONTEND_URL}/admin/tasks/{task_id}"
                style="
                    background: black;
                    color: white;
                    padding: 10px 16px;
                    text-decoration: none;
                    border-radius: 6px;
                    display: inline-block;
                    margin-top: 10px;
                "
            >
                Review Task
            </a>
        </div>
        """
    })


def send_task_accepted_email(user_email, task_title):

    resend.Emails.send({
        "from": "TaskHub <onboarding@resend.dev>",
        "to": [user_email],
        "subject": f"Task Accepted: {task_title}",
        "html": f"""
        <div style="font-family: Arial; padding: 20px;">
            <h2>Task Accepted</h2>

            <p>Your task has been accepted successfully.</p>

            <p>
                <strong>{task_title}</strong>
            </p>

            <p>Great work 🚀</p>
        </div>
        """
    })