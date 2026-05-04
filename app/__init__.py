from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev-secret-key"

    from .routes import bp
    app.register_blueprint(bp)

    return app