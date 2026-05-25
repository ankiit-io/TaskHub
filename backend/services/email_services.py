import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))

SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

FRONTEND_URL = os.getenv("FRONTEND_URL")


def send_email(to_email, subject, html):

    msg = MIMEMultipart()

    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(
        MIMEText(html, "html")
    )

    server = smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT
    )

    server.starttls()

    server.login(
        SMTP_USER,
        SMTP_PASSWORD
    )

    server.sendmail(
        SMTP_USER,
        to_email,
        msg.as_string()
    )

    server.quit()


def send_task_assigned_email(
    user_email,
    user_name,
    task_title,
    task_id
):

    html = f"""
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

    send_email(
        user_email,
        f"New Task Assigned: {task_title}",
        html
    )


def send_task_submitted_email(
    admin_email,
    task_title,
    user_name,
    task_id
):

    html = f"""
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

    send_email(
        admin_email,
        f"Task Completed: {task_title}",
        html
    )


def send_task_accepted_email(
    user_email,
    task_title
):

    html = f"""
    <div style="font-family: Arial; padding: 20px;">
        <h2>Task Accepted</h2>

        <p>Your task has been accepted successfully.</p>

        <p>
            <strong>{task_title}</strong>
        </p>

        <p>Great work 🚀</p>
    </div>
    """

    send_email(
        user_email,
        f"Task Accepted: {task_title}",
        html
    )