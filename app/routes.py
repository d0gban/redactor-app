from flask import Blueprint, render_template, request, send_from_directory, current_app
import os

from .forms import RedactForm
from .services.redactor import run_redaction


bp = Blueprint("main", __name__)


@bp.route("/", methods=["GET"])
def index():
    form = RedactForm()
    return render_template(
        "index.html",
        form=form,
        result=None,
        initial_rules=[]
    )


@bp.route("/redact", methods=["POST"])
def redact():
    form = RedactForm()

    text = request.form.get("text", "") or ""
    rules_json = request.form.get("rules_json", "[]")
    selected_finding_ids_json = request.form.get("selected_finding_ids_json", "[]")

    result = run_redaction(
        text=text,
        raw_rules=rules_json,
        raw_selected_finding_ids=selected_finding_ids_json,
    )

    form.text.data = text

    return render_template(
        "index.html",
        form=form,
        result={
            "redacted_text": result.get("redacted_text", ""),
            "findings": result.get("findings", []),
        },
        initial_rules=result.get("manual_rules", [])
    )


@bp.route("/favicon.ico")
def favicon():
    static_icon_dir = os.path.join(current_app.root_path, "static", "icon")
    return send_from_directory(
        static_icon_dir,
        "favicon-32x32.png",
        mimetype="image/png"
    )