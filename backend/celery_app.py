import os
import ssl

from celery import Celery

from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

celery = Celery(
    "taskhub",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery.conf.update(

    result_backend=REDIS_URL,

    task_track_started=True,

    broker_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    },

    redis_backend_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    }
)