import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "8000")), debug=os.getenv("FLASK_DEBUG") == "1")
