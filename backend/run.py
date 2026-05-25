from flask import Flask

from flask_cors import CORS

from dotenv import load_dotenv

load_dotenv()

from extensions import limiter

from routes.tasks import tasks_bp

app = Flask(__name__)

CORS(app)

limiter.init_app(app)

app.register_blueprint(tasks_bp)

if __name__ == "__main__":
    app.run(debug=True)