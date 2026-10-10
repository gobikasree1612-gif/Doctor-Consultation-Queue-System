from flask import Flask
from flask_cors import CORS
from app.db import init_db
from app.routes import api_bp

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='sat2_doctor_queue_secret_key_2026',
    )

    if test_config:
        app.config.update(test_config)

    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    with app.app_context():
        init_db(app.config.get('DATABASE'))

    app.register_blueprint(api_bp, url_prefix='/api')

    return app
