from flask_wtf import FlaskForm
from wtforms import TextAreaField
from wtforms.validators import Optional

class RedactForm(FlaskForm):
    text = TextAreaField("Source Text", validators=[Optional()])