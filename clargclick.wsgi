from app import app  # Ensure this matches your actual Flask app structure

if __name__ != "__main__":
    application = app  # Many WSGI servers look for `application`
