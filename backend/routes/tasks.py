from flask import Blueprint, request, jsonify

import requests

from services.supabase_client import (
    SUPABASE_URL,
    HEADERS
)

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    product_image_url = data.get("product_image_url")

    if not title:
        return jsonify({
            "error": "Title is required"
        }), 400

    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/tasks",
        headers=HEADERS,
        json={
    "title": title,
    "description": description,
    "product_image_url": product_image_url,
    "assigned_to": data.get("assigned_to"),
    "status": "assigned"
}
    )

    return jsonify({
    "message": "Task created successfully",
    "status_code": response.status_code,
    "response": response.text
}), 201

@tasks_bp.route("/api/tasks", methods=["GET"])
def get_tasks():

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tasks?select=*",
        headers=HEADERS
    )

    return jsonify({
        "tasks": response.json()
    }), 200

@tasks_bp.route("/api/users", methods=["GET"])
def get_users():

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?select=*",
        headers=HEADERS
    )

    users = response.json()

    filtered_users = [
        user for user in users
        if user["role"] != "admin"
    ]

    return jsonify({
        "users": filtered_users
    }), 200

@tasks_bp.route("/api/my-tasks/<user_id>", methods=["GET"])
def get_my_tasks(user_id):

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tasks?assigned_to=eq.{user_id}&select=*",
        headers=HEADERS
    )

    return jsonify({
        "tasks": response.json()
    }), 200

@tasks_bp.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task_status(task_id):

    data = request.get_json()

    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
        headers=HEADERS,
        json={
            "status": data.get("status")
        }
    )

    return jsonify({
        "message": "Task updated successfully"
    }), 200