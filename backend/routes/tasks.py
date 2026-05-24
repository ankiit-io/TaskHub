from flask import Blueprint, request, jsonify
import threading
import uuid
import requests
import os

import replicate

from extensions import limiter

from services.email_services import (
    send_task_submitted_email
)

from services.supabase_client import (
    SUPABASE_URL,
    HEADERS
)

tasks_bp = Blueprint("tasks", __name__)

jobs = {}

client = replicate.Client(
    api_key=os.getenv("REPLICATE_API_TOKEN")
)

PROMPTS = {

    "white_bg": (
        "Place the SAME exact object from the reference image "
        "on a pure white seamless ecommerce studio background. "
        "Keep identical object identity, structure, texture, proportions, "
        "details, engravings, reflections, and material. "
        "Centered composition with soft studio shadows."
    ),

    "theme_marble": (
        "Place the SAME exact object on elegant luxury marble surface. "
        "Premium luxury commercial photography aesthetic. "
        "Preserve all object details exactly."
    ),

    "theme_velvet": (
        "Place the SAME exact object on royal velvet luxury background. "
        "Dark cinematic premium lighting. "
        "Preserve exact object identity and details."
    ),

    "creative_beach": (
        "Place the SAME exact object in a luxury beach sunset scene. "
        "Golden hour cinematic lighting. "
        "Preserve exact object identity and details."
    ),

    "creative_luxury": (
        "Luxury premium commercial photoshoot of the SAME exact object. "
        "Elegant expensive aesthetic. "
        "Preserve all object details exactly."
    ),

    "model_front": (
        "Front-facing product photography of the SAME exact object. "
        "Camera directly facing the object. "
        "Professional studio lighting. "
        "Preserve exact shape, structure, details, and texture."
    ),

    "model_side": (
        "Side-angle product photography of the SAME exact object. "
        "45-degree side perspective. "
        "Professional studio lighting. "
        "Preserve exact object structure and details."
    ),

    "model_closeup": (
        "Macro close-up product photography of the SAME exact object. "
        "Focus on intricate details and texture. "
        "Highly detailed professional commercial photography."
    )
}


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
    "avatar": data.get("image"),
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

    return jsonify(users[0]), 200


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


def generate_single_image(task_id, image_type, job_id):

    jobs[job_id] = {
        "status": "processing"
    }

    try:

        prompt = PROMPTS.get(image_type)

        if not prompt:

            jobs[job_id] = {
                "status": "failed",
                "error": "Invalid image type"
            }

            return

        task_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
            headers=HEADERS
        )

        task = task_response.json()[0]

        product_image_url = task["product_image_url"]

        print("Generating:", image_type)

        full_prompt = (
            "Luxury commercial product photography. "
            "Ultra realistic DSLR quality. "
            "Premium advertising aesthetic. "
            + prompt
        )

        output = replicate.run(
            "black-forest-labs/flux-kontext-pro",
            input={
                "input_image": product_image_url,

                "prompt": (
                    "Use the provided reference image as the MAIN subject. "
                    "Preserve the exact same object identity, shape, structure, texture, material, engravings, proportions, and details. "
                    "Do NOT replace the object with another product. "
                    "Do NOT redesign or reinterpret the item. "
                    "Only modify camera angle, lighting, pose, or background according to the request. "
                    + full_prompt
                ),

                "prompt_strength": (
                    0.01 if image_type == "white_bg" else 0.12
                ),

                "aspect_ratio": "1:1",
                "output_format": "png",
                "safety_tolerance": 2
            }
        )

        generated_image_url = output.url

        image_response = requests.get(
            generated_image_url
        )

        generated_bytes = image_response.content

        file_name = (
            f"{task_id}_{image_type}_{uuid.uuid4()}.png"
        )

        upload_response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/generated-images/{file_name}",
            headers={
                "Authorization": (
                    f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}"
                ),

                "apikey": os.getenv(
                    "SUPABASE_SERVICE_ROLE_KEY"
                ),

                "x-upsert": "true"
            },

            files={
                "file": (
                    file_name,
                    generated_bytes,
                    "image/png"
                )
            }
        )

        if upload_response.status_code >= 400:

            print(upload_response.text)

            jobs[job_id] = {
                "status": "failed",
                "error": "Failed to upload image to Supabase Storage"
            }

            return

        public_url = (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"generated-images/{file_name}"
        )

        payload = {
            "task_id": task_id,
            "image_type": image_type,
            "image_url": public_url,
            "angle": image_type.replace("model_", ""),
            "prompt_used": full_prompt
        }

        requests.post(
            f"{SUPABASE_URL}/rest/v1/generated_images",
            headers=HEADERS,
            json=payload
        )

        print("Generated:", image_type)

        jobs[job_id] = {
            "status": "completed"
        }

    except Exception as e:

        print("GENERATION ERROR:", str(e))

        jobs[job_id] = {
            "status": "failed",
            "error": str(e)
        }


@tasks_bp.route("/api/tasks/<task_id>/generate", methods=["POST"])
@limiter.limit("10 per hour")
def generate_images(task_id):

    data = request.get_json()

    image_type = data.get("image_type")

    if not image_type:

        return jsonify({
            "error": "image_type is required"
        }), 400

    job_id = str(uuid.uuid4())

    thread = threading.Thread(
        target=generate_single_image,
        args=(task_id, image_type, job_id)
    )

    thread.start()

    return jsonify({
        "job_id": job_id
    }), 202


@tasks_bp.route("/api/jobs/<job_id>/status", methods=["GET"])
def get_job_status(job_id):

    job = jobs.get(job_id)

    if not job:

        return jsonify({
            "error": "Job not found"
        }), 404

    return jsonify(job), 200


@tasks_bp.route("/api/tasks/<task_id>/generations", methods=["GET"])
def get_task_generations(task_id):

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/generated_images?task_id=eq.{task_id}&select=*",
        headers=HEADERS
    )

    return jsonify(response.json()), response.status_code


@tasks_bp.route("/api/generations/<generation_id>", methods=["DELETE"])
def delete_generation(generation_id):

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