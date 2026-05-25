import os
import uuid
import requests

import replicate

from celery_app import celery
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": (
        f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    ),
    "Content-Type": "application/json"
}

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


@celery.task(bind=True)
def generate_ai_image(
    self,
    task_id,
    image_type
):

    try:

        prompt = PROMPTS.get(image_type)

        if not prompt:

            return {
                "status": "failed",
                "error": "Invalid image type"
            }

        task_response = requests.get(
            (
                f"{SUPABASE_URL}/rest/v1/tasks"
                f"?id=eq.{task_id}&select=*"
            ),
            headers=HEADERS
        )

        task = task_response.json()[0]

        product_image_url = (
            task["product_image_url"]
        )

        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 20
            }
        )

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
                    0.01
                    if image_type == "white_bg"
                    else 0.12
                ),

                "aspect_ratio": "1:1",
                "output_format": "png",
                "safety_tolerance": 2
            }
        )

        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 70
            }
        )

        generated_image_url = output.url

        image_response = requests.get(
            generated_image_url
        )

        generated_bytes = (
            image_response.content
        )

        file_name = (
            f"{task_id}_{image_type}_{uuid.uuid4()}.png"
        )

        upload_response = requests.post(
            (
                f"{SUPABASE_URL}/storage/v1/object/"
                f"generated-images/{file_name}"
            ),
            headers={
                "Authorization": (
                    f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
                ),

                "apikey":
                    SUPABASE_SERVICE_ROLE_KEY,

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

            return {
                "status": "failed",
                "error": (
                    "Failed to upload image"
                )
            }

        public_url = (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"generated-images/{file_name}"
        )

        payload = {
            "task_id": task_id,
            "image_type": image_type,
            "image_url": public_url,
            "angle": image_type.replace(
                "model_",
                ""
            ),
            "prompt_used": full_prompt
        }

        requests.post(
            (
                f"{SUPABASE_URL}/rest/v1/"
                f"generated_images"
            ),
            headers=HEADERS,
            json=payload
        )

        requests.post(
            f"{SUPABASE_URL}/rest/v1/audit_logs",
            headers=HEADERS,
            json={
                "action": "image_generated",
                "table_name": "generated_images",
                "record_id": task_id,
                "new_data": {
                    "image_type": image_type,
                    "image_url": public_url
                }
            }
        )

        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 100
            }
        )

        return {
            "status": "completed",
            "image_url": public_url
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }