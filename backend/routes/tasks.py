from flask import Blueprint, request, jsonify
import requests
import os
from celery_app import celery

from worker import generate_ai_image
import replicate

from extensions import limiter

from services.email_services import (
    send_task_accepted_email,
    send_task_assigned_email,
    send_task_submitted_email
)

from services.supabase_client import (
    SUPABASE_URL,
    HEADERS
)

tasks_bp = Blueprint("tasks", __name__)


client = replicate.Client(
    api_key=os.getenv("REPLICATE_API_TOKEN")
)


def create_audit_log(action, task_id, user_id=None):

    requests.post(
        f"{SUPABASE_URL}/rest/v1/audit_logs",
        headers=HEADERS,
        json={
            "action": action,
            "record_id": task_id,
            "user_id": user_id,
            "table_name": "tasks"
        }
    )


@tasks_bp.route("/api/save-user", methods=["POST"])
def save_user():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}&select=*",
        headers=HEADERS
    )

    existing_users = response.json()

    if len(existing_users) == 0:

        requests.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=HEADERS,
            json={
    "name": name,
    "email": email,
    "avatar_url": data.get("image"),
    "provider": data.get("provider"),
    "oauth_id": data.get("oauth_id"),
    "role": (
        "admin"
        if email == "ankitrajpurohit10875@gmail.com"
        else "user"
    )
}
        )

    return jsonify({
        "message": "User saved successfully"
    }), 200


@tasks_bp.route("/api/user/<email>", methods=["GET"])
def get_user_by_email(email):

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}&select=*",
        headers=HEADERS
    )

    users = response.json()

    if len(users) == 0:

        return jsonify({
            "role": "user"
        }), 404

    user = users[0]

    if user.get("display_name"):
     user["name"] = user["display_name"]

    if user.get("avatar_url"):
     user["avatar"] = user["avatar_url"]

    return jsonify(user), 200


@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    product_image_url = data.get("product_image_url")
    assigned_to = data.get("assigned_to")

    if not title:

        return jsonify({
            "error": "Title is required"
        }), 400

    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/tasks",
        headers={
            **HEADERS,
            "Prefer": "return=representation"
        },
        json={
            "title": title,
            "description": description,
            "product_image_url": product_image_url,
            "assigned_to": assigned_to,
            "status": "assigned"
        }
    )

    response_data = response.json()

    if isinstance(response_data, list):
     created_task = response_data[0]
    else:
     return jsonify({
        "error": response_data
    }), 500

    create_audit_log(
        "task_created",
        created_task["id"],
        assigned_to
    )
    
    user_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{assigned_to}&select=*",
        headers=HEADERS
    )

    users = user_response.json()

    if len(users) > 0:

        user = users[0]

    try:

        send_task_assigned_email(
            user["email"],
            user["name"],
            created_task["title"],
            created_task["id"]
       )

    except Exception as e:

        print("EMAIL ERROR:", str(e))

    return jsonify({
        "message": "Task created successfully",
        "task": created_task
    }), 201


@tasks_bp.route("/api/tasks", methods=["GET"])
def get_tasks():

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tasks?select=*",
        headers=HEADERS
    )

    tasks = response.json()

    formatted_tasks = []

    for task in tasks:

        # ASSIGNED USER

        assigned_user = None

        if task.get("assigned_to"):

            user_response = requests.get(
                (
                    f"{SUPABASE_URL}/rest/v1/users"
                    f"?id=eq.{task['assigned_to']}&select=*"
                ),
                headers=HEADERS
            )

            user_data = user_response.json()

            if len(user_data) > 0:

                assigned_user = {
                    "id": user_data[0]["id"],
                    "name": user_data[0]["name"],
                    "email": user_data[0]["email"],
                    "avatar": (
    user_data[0].get("avatar_url")
    or user_data[0].get("avatar")
),
                }

        # GENERATED IMAGES COUNT

        generations_response = requests.get(
            (
                f"{SUPABASE_URL}/rest/v1/generated_images"
                f"?task_id=eq.{task['id']}&select=id"
            ),
            headers=HEADERS
        )

        generated_count = len(
            generations_response.json()
        )

        formatted_tasks.append({
            **task,

            "assigned_user": assigned_user,

            "generated_count": generated_count
        })

    return jsonify({
        "tasks": formatted_tasks
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

    tasks = response.json()

    formatted_tasks = []

    for task in tasks:

        generations_response = requests.get(
            (
                f"{SUPABASE_URL}/rest/v1/generated_images"
                f"?task_id=eq.{task['id']}&select=id"
            ),
            headers=HEADERS
        )

        generated_count = len(
            generations_response.json()
        )

        formatted_tasks.append({
            **task,
            "generated_count": generated_count
        })

    return jsonify({
        "tasks": formatted_tasks
    }), 200


@tasks_bp.route("/api/tasks/<task_id>", methods=["GET"])
def get_single_task(task_id):

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
        headers=HEADERS
    )

    data = response.json()

    if len(data) == 0:

        return jsonify({
            "message": "Task not found"
        }), 404

    return jsonify(data[0]), 200


@tasks_bp.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task_status(task_id):

    data = request.get_json()

    status = data.get("status")

    if status == "submitted":

        images_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/generated_images?task_id=eq.{task_id}&select=id,image_type",
            headers=HEADERS
        )

        images = images_response.json()

        required_types = [
            "white_bg",
            "theme_marble",
            "theme_velvet",
            "creative_beach",
            "creative_luxury",
            "model_front",
            "model_side",
            "model_closeup"
        ]

        generated_types = [
            image["image_type"]
            for image in images
        ]

        missing_types = [
            image_type
            for image_type in required_types
            if image_type not in generated_types
        ]

        if len(missing_types) > 0:

            return jsonify({
                "error": "Missing required image types",
                "missing": missing_types
            }), 400

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
        headers=HEADERS,
        json={
            "status": status
        }
    )

    if status == "submitted":

        create_audit_log(
            "task_submitted",
            task_id
        )

        task_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
            headers=HEADERS
        )

        task = task_response.json()[0]

        user_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{task['assigned_to']}&select=*",
            headers=HEADERS
        )

        user = user_response.json()[0]

        admin_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?role=eq.admin&select=*",
            headers=HEADERS
        )

        admin = admin_response.json()[0]

        send_task_submitted_email(
            admin["email"],
            task["title"],
            user["name"],
            task_id
        )

    return jsonify({
        "message": "Task updated successfully"
    }), 200



@tasks_bp.route("/api/tasks/<task_id>/generate", methods=["POST"])
@limiter.limit("10 per hour")
def generate_images(task_id):

    data = request.get_json()

    image_type = data.get("image_type")

    if not image_type:

        return jsonify({
            "error": "image_type is required"
        }), 400

    task = generate_ai_image.delay(
        task_id,
        image_type
    )

    return jsonify({
        "job_id": task.id
    }), 202

@tasks_bp.route("/api/jobs/<job_id>/status", methods=["GET"])
def get_job_status(job_id):

    task_result = celery.AsyncResult(job_id)
    response = {
        "job_id": job_id,
        "state": task_result.state,
    }

    if task_result.state == "PENDING":

        response["progress"] = 0

    elif task_result.state == "PROCESSING":

        response["progress"] = (
            task_result.info.get("progress", 0)
            if task_result.info
            else 0
        )

    elif task_result.state == "SUCCESS":

        response["progress"] = 100

        response["result"] = task_result.result

    elif task_result.state == "FAILURE":

        response["error"] = str(
            task_result.info
        )

    return jsonify(response), 200

@tasks_bp.route("/api/tasks/<task_id>/generations", methods=["GET"])
def get_task_generations(task_id):

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/generated_images?task_id=eq.{task_id}&select=*",
        headers=HEADERS
    )

    return jsonify(response.json()), response.status_code


@tasks_bp.route("/api/generations/<generation_id>", methods=["DELETE"])
def delete_generation(generation_id):

    create_audit_log(
        "image_deleted",
        generation_id
    )
    
    requests.delete(
        f"{SUPABASE_URL}/rest/v1/generated_images?id=eq.{generation_id}",
        headers=HEADERS
    )

    return jsonify({
        "message": "Generation deleted"
    }), 200


@tasks_bp.route("/api/generations/<generation_id>/final", methods=["PATCH"])
def mark_generation_final(generation_id):

    task_id = request.args.get("task_id")

    requests.patch(
        (
            f"{SUPABASE_URL}/rest/v1/generated_images"
            f"?task_id=eq.{task_id}&is_final=eq.true"
        ),
        headers=HEADERS,
        json={
            "is_final": False
        }
    )
    create_audit_log(
        "final_image_changed",
        generation_id
    )

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/generated_images?id=eq.{generation_id}",
        headers=HEADERS,
        json={
            "is_final": True
        }
    )

    return jsonify({
        "message": "Marked as final"
    }), 200


@tasks_bp.route("/api/tasks/<task_id>/accept", methods=["PUT"])
def accept_task(task_id):

    data = request.get_json()

    feedback_note = data.get("feedback_note", "")

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
        headers=HEADERS,
        json={
            "status": "accepted",
            "feedback_note": feedback_note
        }
    )

    create_audit_log(
        "task_accepted",
        task_id
    )
    
    task_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
        headers=HEADERS
    )

    task = task_response.json()[0]

    user_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{task['assigned_to']}&select=*",
        headers=HEADERS
    )

    user = user_response.json()[0]

    try:

        send_task_accepted_email(
            user["email"],
            task["title"]
        )

    except Exception as e:

        print("EMAIL ERROR:", str(e))

    return jsonify({
        "message": "Task accepted successfully"
    }), 200


@tasks_bp.route("/api/tasks/<task_id>/request-revision", methods=["PUT"])
def request_revision(task_id):

    data = request.get_json()

    feedback_note = data.get("feedback_note", "")

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
        headers=HEADERS,
        json={
            "status": "revision_requested",
            "feedback_note": feedback_note
        }
    )

    create_audit_log(
        "revision_requested",
        task_id
    )

    return jsonify({
        "message": "Revision requested"
    }), 200
    
@tasks_bp.route("/api/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.json

    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
        headers={
            **HEADERS,
            "Prefer": "return=representation"
        },
        json={
            "title": data.get("title"),
            "description": data.get("description"),
            "assigned_to": data.get("assigned_to"),
            "feedback_note": data.get("feedback_note"),
            "product_image_url": data.get("product_image_url"),
        }
    )

    return jsonify(response.json()), 200


@tasks_bp.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):

    try:

        # GET TASK

        task_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
            headers=HEADERS,
        )

        task_data = task_response.json()

           
        if len(task_data) == 0:

            return jsonify({
                "error": "Task not found"
            }), 404

        task = task_data[0]

        # DELETE ORIGINAL TASK IMAGE

        original_image = task.get(
            "product_image_url"
        )

        if original_image and "task-image/" in original_image:

            original_file_name = (
                original_image.split(
                    "task-image/"
                )[1]
            )

            requests.delete(
                f"{SUPABASE_URL}/storage/v1/object/task-image/{original_file_name}",
                headers={
                    "Authorization":
                        f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",

                    "apikey":
                        os.getenv(
                            "SUPABASE_SERVICE_ROLE_KEY"
                        ),
                },
            )

        # GET GENERATED IMAGES

        images_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/generated_images?task_id=eq.{task_id}&select=*",
            headers=HEADERS,
        )

        generated_images = (
            images_response.json()
        )

        # DELETE GENERATED STORAGE FILES

        for image in generated_images:

            image_url = image.get(
                "image_url"
            )

            if (
                image_url
                and "generated-images/" in image_url
            ):

                file_name = image_url.split(
                    "generated-images/"
                )[1]

                requests.delete(
                    f"{SUPABASE_URL}/storage/v1/object/generated-images/{file_name}",
                    headers={
                        "Authorization":
                            f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",

                        "apikey":
                            os.getenv(
                                "SUPABASE_SERVICE_ROLE_KEY"
                            ),
                    },
                )

        # DELETE GENERATED IMAGES ROWS

        requests.delete(
            f"{SUPABASE_URL}/rest/v1/generated_images?task_id=eq.{task_id}",
            headers=HEADERS,
        )

        # DELETE AUDIT LOGS

        requests.delete(
            f"{SUPABASE_URL}/rest/v1/audit_logs?record_id=eq.{task_id}",
            headers=HEADERS,
        )

        # DELETE TASK

        requests.delete(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
            headers=HEADERS,
        )

        return jsonify({
            "message":
                "Task and related files deleted successfully"
        }), 200

    except Exception as e:

        print("DELETE TASK ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
        
@tasks_bp.route("/api/users/<user_id>", methods=["PUT"])
def update_user_profile(user_id):

    data = request.get_json()

    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
        headers={
            **HEADERS,
            "Prefer": "return=representation"
        },
        json={
            "display_name": data.get("display_name"),
"name": data.get("display_name"),
            "avatar_url": data.get("avatar_url")
        }
    )

    updated_user = response.json()

    if len(updated_user) == 0:

        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(updated_user[0]), 200